/**
 * TARA Directive File Language Server
 * Provides validation, diagnostics, and hover information for .dir files
 */

import {
  CodeAction,
  CodeActionKind,
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  InitializeResult,
  InsertTextFormat,
  MarkupKind,
  Range,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  Parameter,
  findParameter,
  getParametersByOptionBlock,
  getValidOptionBlocks,
} from './parameters';
import {
  findCommand,
  getCommandsForCompletion,
  TaraCommand,
} from './commands';

const connection = createConnection();
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const maxDiagnosticCount = 100;

const OPTION_BLOCK_ALIASES: Record<string, string> = {
  'opt cont': 'opt cont',
  'opt n-1-1': 'opt N-1-1',
  'opt ems': 'opt EMS',
  'opt screen': 'opt screen',
  'opt sced options': 'opt sced options',
  'opt amb': 'opt amb',
  'opt misc': 'opt misc',
  'opt trlim': 'opt trlim',
  'rptmanager trlim': 'opt trlim',
  'lfopt solve': 'lfopt solve',
  'lfopt adj': 'lfopt adj',
  'lfopt misc': 'lfopt misc',
};

const BLOCK_TERMINATOR_PATTERN = /^0\s+0+(\s+0+)*(\s+STOP)?$/i;
const SINGLE_ZERO_PATTERN = /^0(\s+STOP)?$/i;
const OPT_AMB_SECTION_LABELS = new Set(['general', 'param', 'hourly', 'long', 'ems']);
const READ_MODES = ['PSSE', 'SUBSYS', 'CONT', 'MONIT'] as const;
const SOLVE_METHODS = ['fdec', 'dc'] as const;
const CONT_ANALYSIS_MODES = ['accont', 'dccont', 'acbranch', 'acvolt', 'dcbranch', 'dcvolt'] as const;
const LFREVIEW_REPORT_TYPES = ['subsys', 'larea', 'lzone', 'tzone', 'sum'] as const;
const WARN_REPORT_TYPES = ['sum', 'term', 'list'] as const;

interface ParsedParameterLine {
  name: string;
  value: string;
  nameStart: number;
  nameEnd: number;
  valueStart: number;
  valueEnd: number;
}

interface ParsedToken {
  token: string;
  start: number;
  end: number;
}

interface LineToken {
  value: string;
  start: number;
  end: number;
}

interface DiagnosticQuickFixData {
  replacements?: string[];
  insertText?: string;
  title?: string;
}

function stripInlineComment(line: string): string {
  let inDoubleQuotes = false;

  for (let index = 0; index < line.length - 1; index++) {
    const currentChar = line[index];
    const nextChar = line[index + 1];

    if (currentChar === '"') {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }

    if (!inDoubleQuotes && currentChar === '/' && nextChar === '/') {
      return line.slice(0, index);
    }
  }

  return line;
}

function parseOptionBlock(line: string): string | undefined {
  const content = stripInlineComment(line).trim();
  if (!content) {
    return undefined;
  }

  const tokens = content.split(/\s+/);
  if (tokens.length < 2) {
    return undefined;
  }

  const first = tokens[0].toLowerCase();
  const second = tokens[1].toLowerCase();

  const aliasKey = first === 'opt' && second === 'sced' && tokens[2]?.toLowerCase() === 'options'
    ? 'opt sced options'
    : `${first} ${second}`;

  return OPTION_BLOCK_ALIASES[aliasKey];
}

function parseFirstToken(line: string): ParsedToken | undefined {
  const content = stripInlineComment(line);
  const match = /^(\s*)(\S+)/.exec(content);
  if (!match) {
    return undefined;
  }

  const [, leadingWhitespace, token] = match;
  const start = leadingWhitespace.length;
  const end = start + token.length;

  return {
    token,
    start,
    end,
  };
}

function getTokenAtPosition(line: string, character: number): ParsedToken | undefined {
  const content = stripInlineComment(line);
  const tokenPattern = /%[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*/g;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(content)) !== null) {
    const token = match[0];
    const start = match.index;
    const end = start + token.length;

    if (character >= start && character <= end) {
      return {
        token,
        start,
        end,
      };
    }
  }

  return undefined;
}

function tokenizeLine(line: string): LineToken[] {
  const content = stripInlineComment(line);
  const tokenPattern = /"[^"]*"|[^\s"]+/g;
  const tokens: LineToken[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(content)) !== null) {
    const value = match[0];
    tokens.push({
      value,
      start: match.index,
      end: match.index + value.length,
    });
  }

  return tokens;
}

function isQuotedToken(value: string): boolean {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"');
}

function isNumericToken(value: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(value);
}

function isCommandToken(token: string): boolean {
  if (!token) {
    return false;
  }

  if (token.startsWith('%')) {
    return true;
  }

  return findCommand(token) !== undefined;
}

function isTerminatorLine(line: string, currentOptionBlock?: string): boolean {
  const content = stripInlineComment(line).trim();

  if (!content) {
    return false;
  }

  if (BLOCK_TERMINATOR_PATTERN.test(content)) {
    return true;
  }

  if (SINGLE_ZERO_PATTERN.test(content)) {
    return currentOptionBlock !== 'opt amb';
  }

  return false;
}

function parseParameterLine(line: string): ParsedParameterLine | undefined {
  const content = stripInlineComment(line).trimEnd();
  if (!content) {
    return undefined;
  }

  const match = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s+)("[^"]*"|\S+)/.exec(content);
  if (!match) {
    return undefined;
  }

  const [, leadingWhitespace, name, spacing, value] = match;
  const nameStart = leadingWhitespace.length;
  const nameEnd = nameStart + name.length;
  const valueStart = nameEnd + spacing.length;
  const valueEnd = valueStart + value.length;

  return {
    name,
    value,
    nameStart,
    nameEnd,
    valueStart,
    valueEnd,
  };
}

function unquote(rawValue: string): string {
  if (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) {
    return rawValue.slice(1, -1);
  }
  return rawValue;
}

function makeRange(line: number, startChar: number, endChar: number): Range {
  return {
    start: { line, character: startChar },
    end: { line, character: endChar },
  };
}

function levenshteinDistance(source: string, target: string): number {
  const rows = source.length + 1;
  const cols = target.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row++) {
    matrix[row][0] = row;
  }
  for (let col = 0; col < cols; col++) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const cost = source[row - 1] === target[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function getParameterSuggestions(name: string, optionBlock?: string): string[] {
  const blockCandidates = optionBlock
    ? getParametersByOptionBlock(optionBlock).map(parameter => parameter.name)
    : [];

  const allCandidates = blockCandidates.length > 0
    ? blockCandidates
    : getValidOptionBlocks().flatMap(block => getParametersByOptionBlock(block).map(parameter => parameter.name));

  if (allCandidates.length === 0) {
    return [];
  }

  const normalizedName = name.toLowerCase();
  const prefixMatches = allCandidates
    .filter(candidate => candidate.toLowerCase().startsWith(normalizedName))
    .slice(0, 3);

  if (prefixMatches.length > 0) {
    return prefixMatches;
  }

  return allCandidates
    .map(candidate => ({ candidate, distance: levenshteinDistance(normalizedName, candidate.toLowerCase()) }))
    .filter(item => item.distance <= 4)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 3)
    .map(item => item.candidate);
}

function getOptionBlockAtLine(lines: string[], targetLine: number): string | undefined {
  let currentOptionBlock: string | undefined;

  for (let lineNumber = 0; lineNumber <= targetLine && lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];

    const block = parseOptionBlock(line);
    if (block) {
      currentOptionBlock = block;
      continue;
    }

    if (isTerminatorLine(line, currentOptionBlock)) {
      currentOptionBlock = undefined;
    }
  }

  return currentOptionBlock;
}

function parameterTypeLabel(parameter: Parameter): string {
  if (parameter.type === 'enum' && parameter.validValues) {
    return `enum (${parameter.validValues.join(', ')})`;
  }
  return parameter.type;
}

function buildParameterHover(parameter: Parameter): string {
  const details: string[] = [];
  details.push(`**${parameter.name}**`);
  details.push(`Option block: \`${parameter.optionBlock}\``);
  details.push(`Type: \`${parameterTypeLabel(parameter)}\``);

  if (parameter.default !== undefined) {
    details.push(`Default: \`${parameter.default}\``);
  }

  if (parameter.minValue !== undefined || parameter.maxValue !== undefined) {
    const minLabel = parameter.minValue !== undefined ? `${parameter.minValue}` : '-∞';
    const maxLabel = parameter.maxValue !== undefined ? `${parameter.maxValue}` : '∞';
    details.push(`Range: \`${minLabel} to ${maxLabel}\``);
  }

  details.push('');
  details.push(parameter.description);

  return details.join('\n\n');
}

function buildCommandHover(command: TaraCommand): string {
  const details: string[] = [];
  details.push(`**${command.token}**`);
  details.push(`Category: \`${command.category}\``);
  details.push(`Usage: \`${command.usage}\``);
  details.push('');
  details.push(command.description);
  return details.join('\n\n');
}

function buildGenericDirectiveHover(token: string): string {
  return [
    `**${token}**`,
    'Category: `directive`',
    '',
    'TARA directive token. Common directives include `%trace`, `%include`, `%save`, `%csv`, `%txt`, and `%exit`.',
  ].join('\n\n');
}

function buildCommandCompletionItems(prefix: string): CompletionItem[] {
  return getCommandsForCompletion(prefix).map(command => {
    const snippet = command.completionSnippet ?? command.token;
    const usesSnippetFormat = snippet.includes('${');
    return {
      label: command.token,
      kind: CompletionItemKind.Keyword,
      detail: command.usage,
      documentation: {
        kind: MarkupKind.Markdown,
        value: buildCommandHover(command),
      },
      insertText: snippet,
      insertTextFormat: usesSnippetFormat ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
    };
  });
}

function buildStaticValueCompletionItems(values: readonly string[], prefix: string, detail: string): CompletionItem[] {
  const normalizedPrefix = prefix.trim().toLowerCase();
  return values
    .filter(value => value.toLowerCase().startsWith(normalizedPrefix))
    .map(value => ({
      label: value,
      kind: CompletionItemKind.Value,
      detail,
      insertText: value,
    }));
}

function buildPathCompletionItems(prefix: string, placeholder: string, detail: string): CompletionItem[] {
  const normalizedPrefix = prefix.trim().toLowerCase();
  const label = '"<path>"';

  if (normalizedPrefix && !label.toLowerCase().startsWith(normalizedPrefix) && !prefix.startsWith('"')) {
    return [];
  }

  return [{
    label,
    kind: CompletionItemKind.File,
    detail,
    insertText: `"${'${1:'}${escapeSnippetValue(placeholder)}}"`,
    insertTextFormat: InsertTextFormat.Snippet,
  }];
}

function buildCommandArgumentCompletionItems(beforeCursorNoComment: string): CompletionItem[] {
  const tokens = tokenizeLine(beforeCursorNoComment);
  if (tokens.length === 0) {
    return [];
  }

  const commandToken = tokens[0].value;
  if (!isCommandToken(commandToken)) {
    return [];
  }

  const hasTrailingWhitespace = /\s$/.test(beforeCursorNoComment);
  const activeTokenIndex = hasTrailingWhitespace ? tokens.length : tokens.length - 1;
  const argumentIndex = activeTokenIndex - 1;
  if (argumentIndex < 0) {
    return [];
  }

  const tokenPrefix = hasTrailingWhitespace ? '' : tokens[tokens.length - 1].value;
  const args = tokens.slice(1).map(token => token.value);
  const commandLower = commandToken.toLowerCase();

  if (commandToken.startsWith('%')) {
    switch (commandLower) {
      case '%trace':
        if (argumentIndex === 0) {
          return buildPathCompletionItems(tokenPrefix, 'TARAlog.txt', '%trace log file path');
        }
        if (argumentIndex === 1) {
          return buildStaticValueCompletionItems(['%txt', '%csv'], tokenPrefix, 'Trace output format');
        }
        return [];
      case '%include':
      case '%run':
      case '%read':
        if (argumentIndex === 0) {
          return buildPathCompletionItems(tokenPrefix, 'Options_common.dir', `${commandToken} file path`);
        }
        return [];
      case '%save':
      case '%add':
        if (argumentIndex === 0) {
          return buildPathCompletionItems(tokenPrefix, 'output.csv', `${commandToken} output path`);
        }
        return [];
      default:
        return [];
    }
  }

  switch (commandLower) {
    case 'read': {
      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(READ_MODES, tokenPrefix, 'READ mode');
      }

      const readMode = (args[0] ?? '').toUpperCase();
      if (readMode === 'PSSE') {
        if (argumentIndex === 1) {
          return buildStaticValueCompletionItems(['26', '27', '28', '29', '30', '31', '32', '33', '34', '35'], tokenPrefix, 'PSSE version');
        }
        if (argumentIndex === 2) {
          return buildPathCompletionItems(tokenPrefix, 'case.raw', 'PSSE RAW case path');
        }
        if (argumentIndex === 3 || argumentIndex === 4) {
          return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
        }
        return [];
      }

      if (readMode === 'SUBSYS' && argumentIndex === 1) {
        return buildPathCompletionItems(tokenPrefix, 'case.sub', 'Subsystem file path');
      }
      if (readMode === 'CONT' && argumentIndex === 1) {
        return buildPathCompletionItems(tokenPrefix, 'case.con', 'Contingency file path');
      }
      if (readMode === 'MONIT' && argumentIndex === 1) {
        return buildPathCompletionItems(tokenPrefix, 'case.mon', 'Monitored element file path');
      }

      return [];
    }
    case 'solve':
      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(SOLVE_METHODS, tokenPrefix, 'Solve method');
      }
      if (argumentIndex === 1 || argumentIndex === 2) {
        return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
      }
      return [];
    case 'cont':
      if (commandToken === 'CONT') {
        if (argumentIndex === 0) {
          return buildPathCompletionItems(tokenPrefix, 'case.con', 'Contingency file path');
        }
        if (argumentIndex >= 1) {
          return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
        }
        return [];
      }

      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(CONT_ANALYSIS_MODES, tokenPrefix, 'Contingency analysis mode');
      }
      if (argumentIndex === 1) {
        return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
      }
      return [];
    case 'monit':
      if (argumentIndex === 0) {
        return buildPathCompletionItems(tokenPrefix, 'case.mon', 'Monitored element file path');
      }
      if (argumentIndex >= 1) {
        return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
      }
      return [];
    case 'chdir':
      if (argumentIndex === 0) {
        return buildPathCompletionItems(tokenPrefix, 'path/to/directory', 'Directory path');
      }
      return [];
    case 'lfreview':
      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(['%save', '%add'], tokenPrefix, 'Output directive');
      }
      if (argumentIndex === 1) {
        return buildPathCompletionItems(tokenPrefix, 'temp_report.txt', 'Report output path');
      }
      if (argumentIndex === 2) {
        return buildStaticValueCompletionItems(['%csv', '%txt'], tokenPrefix, 'Output format');
      }
      if (argumentIndex === 3 && (args[2] ?? '').toLowerCase() === '%csv') {
        return buildStaticValueCompletionItems(LFREVIEW_REPORT_TYPES, tokenPrefix, 'LF review report type');
      }
      if (argumentIndex >= 4) {
        return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
      }
      return [];
    case 'warn':
      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(['%save', '%add'], tokenPrefix, 'Output directive');
      }
      if (argumentIndex === 1) {
        return buildPathCompletionItems(tokenPrefix, 'Warn_Sum.csv', 'Warn output path');
      }
      if (argumentIndex === 2) {
        return buildStaticValueCompletionItems(['%csv', '%txt'], tokenPrefix, 'Output format');
      }
      if (argumentIndex === 3 && (args[2] ?? '').toLowerCase() === '%csv') {
        return buildStaticValueCompletionItems(WARN_REPORT_TYPES, tokenPrefix, 'Warn report type');
      }
      if (argumentIndex >= 4) {
        return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
      }
      return [];
    case 'rptmanager':
      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(['TrLim'], tokenPrefix, 'RPTManager report group');
      }
      return [];
    case 'trlim':
      if (argumentIndex === 0) {
        return buildStaticValueCompletionItems(['%save', '%add'], tokenPrefix, 'Output directive');
      }
      if (argumentIndex === 1 && ['%save', '%add'].includes((args[0] ?? '').toLowerCase())) {
        return buildPathCompletionItems(tokenPrefix, 'TrLim.csv', 'TrLim output path');
      }
      if (argumentIndex === 2 && ['%save', '%add'].includes((args[0] ?? '').toLowerCase())) {
        return buildStaticValueCompletionItems(['%csv', '%txt'], tokenPrefix, 'Output format');
      }
      if (argumentIndex === 3 && (args[2] ?? '').toLowerCase() === '%csv') {
        return buildStaticValueCompletionItems(['scaleTrLim'], tokenPrefix, 'TrLim report type');
      }
      if (argumentIndex >= 4) {
        return buildStaticValueCompletionItems(['0'], tokenPrefix, 'Terminator value');
      }
      return [];
    default:
      return [];
  }
}

function buildOptionBlockCompletionItems(prefix: string): CompletionItem[] {
  const normalizedPrefix = prefix.toLowerCase();
  return getValidOptionBlocks()
    .filter(optionBlock => optionBlock.toLowerCase().startsWith(normalizedPrefix))
    .map(optionBlock => ({
      label: optionBlock,
      kind: CompletionItemKind.Keyword,
      detail: 'Option block header',
      insertText: `${optionBlock}`,
    }));
}

function escapeSnippetValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/}/g, '\\}');
}

function buildParameterInsertSnippet(parameter: Parameter): string {
  const trailingComment = parameter.description
    ? ` // ${escapeSnippetValue(parameter.description)}`
    : '';

  if (parameter.type === 'enum' && parameter.validValues && parameter.validValues.length > 0) {
    const defaultValue = parameter.default !== undefined ? String(parameter.default) : parameter.validValues[0];
    const orderedValues = [defaultValue, ...parameter.validValues.filter(value => value !== defaultValue)];
    const choices = orderedValues.map(value => escapeSnippetValue(value)).join(',');
    return `${parameter.name} ${'${1|'}${choices}|}${trailingComment}`;
  }

  if (parameter.type === 'string') {
    const defaultValue = parameter.default !== undefined
      ? escapeSnippetValue(String(parameter.default))
      : 'value';
    return `${parameter.name} "${'${1:'}${defaultValue}}"${trailingComment}`;
  }

  if (parameter.type === 'boolean') {
    const defaultValue = parameter.default !== undefined
      ? String(parameter.default)
      : 'false';
    return `${parameter.name} ${'${1:'}${escapeSnippetValue(defaultValue)}}${trailingComment}`;
  }

  // number and fallback
  const defaultNumericValue = parameter.default !== undefined
    ? String(parameter.default)
    : '0';
  return `${parameter.name} ${'${1:'}${escapeSnippetValue(defaultNumericValue)}}${trailingComment}`;
}

function buildParameterCompletionItems(optionBlock: string): CompletionItem[] {
  return getParametersByOptionBlock(optionBlock)
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(parameter => ({
      label: parameter.name,
      kind: CompletionItemKind.Field,
      detail: `${optionBlock} parameter`,
      documentation: {
        kind: MarkupKind.Markdown,
        value: buildParameterHover(parameter),
      },
      insertText: buildParameterInsertSnippet(parameter),
      insertTextFormat: InsertTextFormat.Snippet,
    }));
}

function buildCommandDiagnostic(
  lineNumber: number,
  token: LineToken | undefined,
  message: string,
  severity: DiagnosticSeverity = DiagnosticSeverity.Warning,
  code?: string,
  data?: DiagnosticQuickFixData,
): Diagnostic {
  const start = token ? token.start : 0;
  const end = token ? token.end : 1;

  return {
    severity,
    range: makeRange(lineNumber, start, Math.max(start + 1, end)),
    message,
    code,
    data,
  };
}

function createQuickFixAction(
  title: string,
  uri: string,
  range: Range,
  newText: string,
  diagnostic: Diagnostic,
): CodeAction {
  return {
    title,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [uri]: [{ range, newText }],
      },
    },
  };
}

function buildDiagnosticQuickFixes(document: TextDocument, uri: string, diagnostic: Diagnostic): CodeAction[] {
  const quickFixData = diagnostic.data as DiagnosticQuickFixData | undefined;
  const diagnosticCode = typeof diagnostic.code === 'string' ? diagnostic.code : undefined;
  if (!diagnosticCode) {
    return [];
  }

  switch (diagnosticCode) {
    case 'replace-token': {
      const replacements = quickFixData?.replacements ?? [];
      return replacements.map(replacement => createQuickFixAction(
        `Replace with ${replacement}`,
        uri,
        diagnostic.range,
        replacement,
        diagnostic,
      ));
    }
    case 'wrap-quotes': {
      const existingValue = document.getText(diagnostic.range);
      if (!existingValue) {
        return [];
      }

      return [createQuickFixAction(
        'Wrap value in double quotes',
        uri,
        diagnostic.range,
        `"${existingValue.replace(/^"|"$/g, '')}"`,
        diagnostic,
      )];
    }
    case 'insert-after-range': {
      const insertText = quickFixData?.insertText;
      if (!insertText) {
        return [];
      }

      return [createQuickFixAction(
        quickFixData?.title ?? `Insert ${insertText.trim()}`,
        uri,
        { start: diagnostic.range.end, end: diagnostic.range.end },
        insertText,
        diagnostic,
      )];
    }
    default:
      return [];
  }
}

function validateReportCommandArgs(
  commandToken: LineToken,
  args: LineToken[],
  validReportTypes: readonly string[],
  lineNumber: number,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const outputDirectiveIndex = args.findIndex(argument => {
    const value = argument.value.toLowerCase();
    return value === '%save' || value === '%add';
  });

  if (outputDirectiveIndex < 0) {
    diagnostics.push(buildCommandDiagnostic(
      lineNumber,
      commandToken,
      `Expected %save or %add in "${commandToken.value}" command.`,
      DiagnosticSeverity.Warning,
      'insert-after-range',
      {
        insertText: ' %save "output.csv"',
        title: 'Insert %save output directive',
      },
    ));
  } else {
    const outputPathToken = args[outputDirectiveIndex + 1];
    if (!outputPathToken) {
      diagnostics.push(buildCommandDiagnostic(
        lineNumber,
        args[outputDirectiveIndex],
        `Missing output path after ${args[outputDirectiveIndex].value}.`,
        DiagnosticSeverity.Error,
        'insert-after-range',
        {
          insertText: ' "output.csv"',
          title: 'Insert output path',
        },
      ));
    } else if (!isQuotedToken(outputPathToken.value)) {
      diagnostics.push(buildCommandDiagnostic(
        lineNumber,
        outputPathToken,
        'Output path should be enclosed in double quotes.',
        DiagnosticSeverity.Warning,
        'wrap-quotes',
      ));
    }
  }

  const formatIndex = args.findIndex(argument => {
    const value = argument.value.toLowerCase();
    return value === '%csv' || value === '%txt';
  });

  if (formatIndex < 0) {
    const formatAnchor = outputDirectiveIndex >= 0
      ? args[outputDirectiveIndex + 1] ?? args[outputDirectiveIndex] ?? commandToken
      : commandToken;

    diagnostics.push(buildCommandDiagnostic(
      lineNumber,
      formatAnchor,
      `Expected %csv or %txt format token in "${commandToken.value}" command.`,
      DiagnosticSeverity.Warning,
      'insert-after-range',
      {
        insertText: ' %csv',
        title: 'Insert %csv format token',
      },
    ));
    return diagnostics;
  }

  const formatValue = args[formatIndex].value.toLowerCase();
  if (formatValue === '%csv') {
    const reportTypeToken = args[formatIndex + 1];
    if (!reportTypeToken) {
      diagnostics.push(buildCommandDiagnostic(
        lineNumber,
        args[formatIndex],
        `Missing report type after %csv. Valid values: ${validReportTypes.join(', ')}`,
        DiagnosticSeverity.Error,
        'insert-after-range',
        {
          insertText: ` ${validReportTypes[0]}`,
          title: `Insert ${validReportTypes[0]} report type`,
        },
      ));
    } else if (!validReportTypes.includes(reportTypeToken.value.toLowerCase())) {
      diagnostics.push(buildCommandDiagnostic(
        lineNumber,
        reportTypeToken,
        `Invalid report type "${reportTypeToken.value}". Valid values: ${validReportTypes.join(', ')}`,
        DiagnosticSeverity.Error,
        'replace-token',
        { replacements: [...validReportTypes] },
      ));
    }
  }

  return diagnostics;
}

function validateCommandLine(line: string, lineNumber: number): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const tokens = tokenizeLine(line);

  if (tokens.length === 0) {
    return diagnostics;
  }

  const commandToken = tokens[0];
  if (!isCommandToken(commandToken.value)) {
    return diagnostics;
  }

  const commandLower = commandToken.value.toLowerCase();
  const args = tokens.slice(1);

  switch (commandLower) {
    case 'read': {
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          `Missing READ mode. Expected one of: ${READ_MODES.join(', ')}`,
          DiagnosticSeverity.Error,
          'insert-after-range',
          {
            insertText: ' PSSE 35 "case.raw" 0',
            title: 'Insert READ PSSE template',
          },
        ));
        break;
      }

      const modeToken = args[0];
      const readMode = modeToken.value.toUpperCase();

      if (!READ_MODES.includes(readMode as typeof READ_MODES[number])) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          modeToken,
          `Invalid READ mode "${modeToken.value}". Expected one of: ${READ_MODES.join(', ')}`,
          DiagnosticSeverity.Error,
          'replace-token',
          { replacements: [...READ_MODES] },
        ));
        break;
      }

      if (readMode === 'PSSE') {
        const versionToken = args[1];
        const pathToken = args[2];
        const trailingZeroToken = args[3];

        if (!versionToken || !pathToken || !trailingZeroToken) {
          diagnostics.push(buildCommandDiagnostic(
            lineNumber,
            commandToken,
            'READ PSSE expects: READ PSSE <version> "<case.raw>" 0',
            DiagnosticSeverity.Error,
          ));
          break;
        }

        if (!isNumericToken(versionToken.value)) {
          diagnostics.push(buildCommandDiagnostic(
            lineNumber,
            versionToken,
            `PSSE version should be numeric. Received "${versionToken.value}".`,
            DiagnosticSeverity.Error,
          ));
        }

        if (!isQuotedToken(pathToken.value)) {
          diagnostics.push(buildCommandDiagnostic(
            lineNumber,
            pathToken,
            'Case path should be enclosed in double quotes.',
            DiagnosticSeverity.Warning,
            'wrap-quotes',
          ));
        }

        if (trailingZeroToken.value !== '0') {
          diagnostics.push(buildCommandDiagnostic(
            lineNumber,
            trailingZeroToken,
            `Expected trailing terminator 0 after READ PSSE case path. Received "${trailingZeroToken.value}".`,
            DiagnosticSeverity.Warning,
            'replace-token',
            { replacements: ['0'] },
          ));
        }

        break;
      }

      const pathToken = args[1];
      if (!pathToken) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          modeToken,
          `READ ${readMode} expects a quoted file path argument.`,
          DiagnosticSeverity.Error,
          'insert-after-range',
          {
            insertText: readMode === 'SUBSYS'
              ? ' "case.sub"'
              : readMode === 'CONT'
                ? ' "case.con"'
                : ' "case.mon"',
            title: 'Insert file path',
          },
        ));
      } else if (!isQuotedToken(pathToken.value)) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          pathToken,
          'File path should be enclosed in double quotes.',
          DiagnosticSeverity.Warning,
          'wrap-quotes',
        ));
      }

      break;
    }
    case 'cont': {
      if (commandToken.value === 'CONT') {
        if (args.length === 0) {
          diagnostics.push(buildCommandDiagnostic(
            lineNumber,
            commandToken,
            'CONT expects a quoted contingency file path.',
            DiagnosticSeverity.Error,
            'insert-after-range',
            {
              insertText: ' "case.con"',
              title: 'Insert contingency file path',
            },
          ));
          break;
        }

        if (!isQuotedToken(args[0].value)) {
          diagnostics.push(buildCommandDiagnostic(
            lineNumber,
            args[0],
            'CONT file path should be enclosed in double quotes.',
            DiagnosticSeverity.Warning,
            'wrap-quotes',
          ));
        }

        break;
      }

      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          `cont expects a mode. Valid values: ${CONT_ANALYSIS_MODES.join(', ')}`,
          DiagnosticSeverity.Warning,
          'insert-after-range',
          {
            insertText: ` ${CONT_ANALYSIS_MODES[0]} 0`,
            title: `Insert ${CONT_ANALYSIS_MODES[0]} mode`,
          },
        ));
        break;
      }

      const modeToken = args[0];
      const mode = modeToken.value.toLowerCase();
      if (!CONT_ANALYSIS_MODES.includes(mode as typeof CONT_ANALYSIS_MODES[number])) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          modeToken,
          `Invalid cont mode "${modeToken.value}". Valid values: ${CONT_ANALYSIS_MODES.join(', ')}`,
          DiagnosticSeverity.Warning,
          'replace-token',
          { replacements: [...CONT_ANALYSIS_MODES] },
        ));
      }

      if (args[1] && args[1].value !== '0') {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[1],
          `Expected trailing terminator 0 in cont command. Received "${args[1].value}".`,
          DiagnosticSeverity.Warning,
          'replace-token',
          { replacements: ['0'] },
        ));
      }

      break;
    }
    case 'solve': {
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          `solve expects a method. Valid values: ${SOLVE_METHODS.join(', ')}`,
          DiagnosticSeverity.Warning,
          'insert-after-range',
          {
            insertText: ` ${SOLVE_METHODS[0]} 0 0`,
            title: `Insert ${SOLVE_METHODS[0]} solve template`,
          },
        ));
        break;
      }

      const methodToken = args[0];
      const method = methodToken.value.toLowerCase();
      if (!SOLVE_METHODS.includes(method as typeof SOLVE_METHODS[number])) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          methodToken,
          `Invalid solve method "${methodToken.value}". Valid values: ${SOLVE_METHODS.join(', ')}`,
          DiagnosticSeverity.Warning,
          'replace-token',
          { replacements: [...SOLVE_METHODS] },
        ));
      }

      break;
    }
    case 'lfreview':
      diagnostics.push(...validateReportCommandArgs(commandToken, args, LFREVIEW_REPORT_TYPES, lineNumber));
      break;
    case 'warn':
      diagnostics.push(...validateReportCommandArgs(commandToken, args, WARN_REPORT_TYPES, lineNumber));
      break;
    case 'rptmanager':
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          'RPTManager expects a report group token (e.g., TrLim).',
          DiagnosticSeverity.Warning,
          'insert-after-range',
          {
            insertText: ' TrLim',
            title: 'Insert TrLim target',
          },
        ));
      } else if (args[0].value.toLowerCase() !== 'trlim') {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[0],
          `Unknown RPTManager target "${args[0].value}". Expected TrLim.`,
          DiagnosticSeverity.Warning,
          'replace-token',
          { replacements: ['TrLim'] },
        ));
      }
      break;
    case 'chdir':
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          'chdir expects a quoted directory path.',
          DiagnosticSeverity.Error,
          'insert-after-range',
          {
            insertText: ' "path/to/directory"',
            title: 'Insert directory path',
          },
        ));
      } else if (!isQuotedToken(args[0].value)) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[0],
          'Directory path should be enclosed in double quotes.',
          DiagnosticSeverity.Warning,
          'wrap-quotes',
        ));
      }
      break;
    case 'monit':
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          'MONIT expects a quoted monitored element file path.',
          DiagnosticSeverity.Error,
          'insert-after-range',
          {
            insertText: ' "case.mon"',
            title: 'Insert MONIT file path',
          },
        ));
      } else if (!isQuotedToken(args[0].value)) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[0],
          'MONIT file path should be enclosed in double quotes.',
          DiagnosticSeverity.Warning,
          'wrap-quotes',
        ));
      }
      break;
    case 'trlim':
      if (args[0] && !['%save', '%add'].includes(args[0].value.toLowerCase())) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[0],
          `Unexpected TrLim argument "${args[0].value}". Expected %save or %add when providing inline output options.`,
          DiagnosticSeverity.Warning,
        ));
      }
      break;
    case '%trace':
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          '%trace expects a quoted log file path.',
          DiagnosticSeverity.Error,
          'insert-after-range',
          {
            insertText: ' "TARAlog.txt" %txt',
            title: 'Insert trace file path',
          },
        ));
      } else if (!isQuotedToken(args[0].value)) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[0],
          'Trace file path should be enclosed in double quotes.',
          DiagnosticSeverity.Warning,
          'wrap-quotes',
        ));
      }

      if (args[1] && !['%txt', '%csv'].includes(args[1].value.toLowerCase())) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[1],
          `Invalid %trace format "${args[1].value}". Expected %txt or %csv.`,
          DiagnosticSeverity.Warning,
          'replace-token',
          { replacements: ['%txt', '%csv'] },
        ));
      }
      break;
    case '%include':
    case '%run':
    case '%read':
    case '%save':
    case '%add':
      if (args.length === 0) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          commandToken,
          `${commandToken.value} expects a quoted file path argument.`,
          DiagnosticSeverity.Error,
          'insert-after-range',
          {
            insertText: commandToken.value.toLowerCase() === '%save' || commandToken.value.toLowerCase() === '%add'
              ? ' "output.csv"'
              : ' "input.txt"',
            title: 'Insert file path',
          },
        ));
      } else if (!isQuotedToken(args[0].value)) {
        diagnostics.push(buildCommandDiagnostic(
          lineNumber,
          args[0],
          'File path should be enclosed in double quotes.',
          DiagnosticSeverity.Warning,
          'wrap-quotes',
        ));
      }
      break;
    default:
      break;
  }

  return diagnostics;
}

function validateDocument(document: TextDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = document.getText().split(/\r?\n/);

  let currentOptionBlock: string | undefined;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmedLine = stripInlineComment(line).trim();

    if (!trimmedLine) {
      continue;
    }

    const optionBlock = parseOptionBlock(line);
    if (optionBlock) {
      currentOptionBlock = optionBlock;
      continue;
    }

    if (isTerminatorLine(line, currentOptionBlock)) {
      currentOptionBlock = undefined;
      continue;
    }

    const firstToken = parseFirstToken(line);
    if (firstToken && isCommandToken(firstToken.token)) {
      const commandDiagnostics = validateCommandLine(line, lineNum);
      for (const commandDiagnostic of commandDiagnostics) {
        diagnostics.push(commandDiagnostic);
        if (diagnostics.length >= maxDiagnosticCount) {
          break;
        }
      }

      if (diagnostics.length >= maxDiagnosticCount) {
        break;
      }

      continue;
    }

    if (currentOptionBlock === 'opt amb' && OPT_AMB_SECTION_LABELS.has(trimmedLine.toLowerCase())) {
      continue;
    }

    const parsedLine = parseParameterLine(line);
    if (!parsedLine || !currentOptionBlock) {
      continue;
    }

    const paramName = parsedLine.name;
    const paramValueRaw = parsedLine.value;
    const paramValue = unquote(paramValueRaw);

    const parameter = findParameter(paramName, currentOptionBlock) ?? findParameter(paramName);
    if (!parameter) {
      const suggestions = getParameterSuggestions(paramName, currentOptionBlock);
      const suffix = suggestions.length > 0
        ? ` Did you mean: ${suggestions.join(', ')}?`
        : '';

      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: makeRange(lineNum, parsedLine.nameStart, parsedLine.nameEnd),
        message: `Unknown parameter: "${paramName}" in block "${currentOptionBlock}".${suffix}`
      });

      if (diagnostics.length >= maxDiagnosticCount) {
        break;
      }
      continue;
    }

    if (parameter.type === 'enum' && parameter.validValues) {
      if (!parameter.validValues.includes(paramValue)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
          message: `Invalid value "${paramValue}" for parameter "${paramName}". Valid values: ${parameter.validValues.join(', ')}`
        });
      }
    } else if (parameter.type === 'number') {
      const isPlaceholder = /^\$\{[^}]+\}$/.test(paramValue);
      const numValue = Number(paramValue);

      if (!isPlaceholder && Number.isNaN(numValue)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
          message: `Invalid number value "${paramValueRaw}" for parameter "${paramName}"`
        });
      } else if (!Number.isNaN(numValue)) {
        if (parameter.minValue !== undefined && numValue < parameter.minValue) {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
            message: `Value ${numValue} is below minimum ${parameter.minValue} for parameter "${paramName}"`
          });
        }

        if (parameter.maxValue !== undefined && numValue > parameter.maxValue) {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
            message: `Value ${numValue} exceeds maximum ${parameter.maxValue} for parameter "${paramName}"`
          });
        }
      }
    }

    if (diagnostics.length >= maxDiagnosticCount) {
      break;
    }
  }

  return diagnostics;
}

function sendDiagnostics(document: TextDocument): void {
  const diagnostics = validateDocument(document);
  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

connection.onInitialize((): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: true,
      codeActionProvider: true,
      completionProvider: {
        triggerCharacters: ['%'],
      },
    }
  };
});

connection.onCompletion((params): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const lines = document.getText().split(/\r?\n/);
  if (params.position.line < 0 || params.position.line >= lines.length) {
    return [];
  }

  const line = lines[params.position.line];
  const beforeCursor = line.slice(0, params.position.character);
  const beforeCursorNoComment = stripInlineComment(beforeCursor);
  const currentOptionBlock = getOptionBlockAtLine(lines, params.position.line);

  const optionBlockHeaderMatch = /^\s*((?:opt|lfopt|rptmanager)\s+[A-Za-z0-9_\-]*)$/i.exec(beforeCursorNoComment);
  if (optionBlockHeaderMatch) {
    const prefix = optionBlockHeaderMatch[1];
    const items = buildOptionBlockCompletionItems(prefix);
    if (items.length > 0) {
      return items;
    }
  }

  // Blank line or start-of-line with no typed chars: show all applicable completions
  if (/^\s*$/.test(beforeCursorNoComment)) {
    if (currentOptionBlock) {
      return buildParameterCompletionItems(currentOptionBlock);
    }
    return buildCommandCompletionItems('');
  }

  const commandArgumentItems = buildCommandArgumentCompletionItems(beforeCursorNoComment);
  if (commandArgumentItems.length > 0) {
    return commandArgumentItems;
  }

  const tokenPrefixMatch = /(%?[A-Za-z_][A-Za-z0-9_]*)$/.exec(beforeCursorNoComment);
  if (!tokenPrefixMatch) {
    return [];
  }

  const tokenPrefix = tokenPrefixMatch[1];
  const isFirstToken = /^\s*%?[A-Za-z_][A-Za-z0-9_]*$/.test(beforeCursorNoComment);

  if (tokenPrefix.startsWith('%')) {
    return buildCommandCompletionItems(tokenPrefix).filter(item => item.label.startsWith('%'));
  }

  if (currentOptionBlock && isFirstToken && !isCommandToken(tokenPrefix)) {
    return buildParameterCompletionItems(currentOptionBlock).filter(item =>
      item.label.toLowerCase().startsWith(tokenPrefix.toLowerCase())
    );
  }

  if (isFirstToken) {
    return buildCommandCompletionItems(tokenPrefix);
  }

  return [];
});

connection.onHover((params): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const lines = document.getText().split(/\r?\n/);
  if (params.position.line < 0 || params.position.line >= lines.length) {
    return null;
  }

  const line = lines[params.position.line];
  const optionBlockOnLine = parseOptionBlock(line);

  const tokenAtCursor = getTokenAtPosition(line, params.position.character);
  if (tokenAtCursor && !optionBlockOnLine) {
    const command = findCommand(tokenAtCursor.token);

    if (command) {
      return {
        range: makeRange(params.position.line, tokenAtCursor.start, tokenAtCursor.end),
        contents: {
          kind: MarkupKind.Markdown,
          value: buildCommandHover(command),
        }
      };
    }

    if (tokenAtCursor.token.startsWith('%')) {
      return {
        range: makeRange(params.position.line, tokenAtCursor.start, tokenAtCursor.end),
        contents: {
          kind: MarkupKind.Markdown,
          value: buildGenericDirectiveHover(tokenAtCursor.token),
        }
      };
    }
  }

  const parsedLine = parseParameterLine(line);
  if (!parsedLine) {
    return null;
  }

  const isOnParameterName =
    params.position.character >= parsedLine.nameStart &&
    params.position.character <= parsedLine.nameEnd;

  const isOnParameterValue =
    params.position.character >= parsedLine.valueStart &&
    params.position.character <= parsedLine.valueEnd;

  if (!isOnParameterName && !isOnParameterValue) {
    return null;
  }

  const currentOptionBlock = getOptionBlockAtLine(lines, params.position.line);
  const parameter = currentOptionBlock
    ? findParameter(parsedLine.name, currentOptionBlock) ?? findParameter(parsedLine.name)
    : findParameter(parsedLine.name);

  if (!parameter) {
    return null;
  }

  return {
    range: makeRange(params.position.line, parsedLine.nameStart, parsedLine.nameEnd),
    contents: {
      kind: MarkupKind.Markdown,
      value: buildParameterHover(parameter),
    }
  };
});

connection.onCodeAction((params): CodeAction[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const actions: CodeAction[] = [];
  for (const diagnostic of params.context.diagnostics) {
    actions.push(...buildDiagnosticQuickFixes(document, params.textDocument.uri, diagnostic));
  }

  return actions;
});

documents.onDidOpen(change => {
  sendDiagnostics(change.document);
});

documents.onDidChangeContent(change => {
  sendDiagnostics(change.document);
});

documents.onDidClose(change => {
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] });
});

documents.listen(connection);
connection.listen();
