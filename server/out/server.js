"use strict";
/**
 * TARA Directive File Language Server
 * Provides validation, diagnostics, and hover information for .dir files
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const parameters_1 = require("./parameters");
const connection = (0, node_1.createConnection)();
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const maxDiagnosticCount = 100;
const OPTION_BLOCK_ALIASES = {
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
const COMMAND_PATTERN = /^(READ|CONT|MONIT|solve|cont|save|stop|chdir|warn|lfreview|trlim|%|fdec)\b/i;
const TERMINATOR_PATTERN = /^0(\s+0+)*(\s+STOP)?$/i;
function stripInlineComment(line) {
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
function parseOptionBlock(line) {
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
function isTerminatorLine(line) {
    const content = stripInlineComment(line).trim();
    return TERMINATOR_PATTERN.test(content);
}
function parseParameterLine(line) {
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
function unquote(rawValue) {
    if (rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2) {
        return rawValue.slice(1, -1);
    }
    return rawValue;
}
function makeRange(line, startChar, endChar) {
    return {
        start: { line, character: startChar },
        end: { line, character: endChar },
    };
}
function levenshteinDistance(source, target) {
    const rows = source.length + 1;
    const cols = target.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let row = 0; row < rows; row++) {
        matrix[row][0] = row;
    }
    for (let col = 0; col < cols; col++) {
        matrix[0][col] = col;
    }
    for (let row = 1; row < rows; row++) {
        for (let col = 1; col < cols; col++) {
            const cost = source[row - 1] === target[col - 1] ? 0 : 1;
            matrix[row][col] = Math.min(matrix[row - 1][col] + 1, matrix[row][col - 1] + 1, matrix[row - 1][col - 1] + cost);
        }
    }
    return matrix[rows - 1][cols - 1];
}
function getParameterSuggestions(name, optionBlock) {
    const blockCandidates = optionBlock
        ? (0, parameters_1.getParametersByOptionBlock)(optionBlock).map(parameter => parameter.name)
        : [];
    const allCandidates = blockCandidates.length > 0
        ? blockCandidates
        : (0, parameters_1.getValidOptionBlocks)().flatMap(block => (0, parameters_1.getParametersByOptionBlock)(block).map(parameter => parameter.name));
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
function getOptionBlockAtLine(lines, targetLine) {
    let currentOptionBlock;
    for (let lineNumber = 0; lineNumber <= targetLine && lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        const block = parseOptionBlock(line);
        if (block) {
            currentOptionBlock = block;
            continue;
        }
        if (isTerminatorLine(line)) {
            currentOptionBlock = undefined;
        }
    }
    return currentOptionBlock;
}
function parameterTypeLabel(parameter) {
    if (parameter.type === 'enum' && parameter.validValues) {
        return `enum (${parameter.validValues.join(', ')})`;
    }
    return parameter.type;
}
function buildParameterHover(parameter) {
    const details = [];
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
function validateDocument(document) {
    const diagnostics = [];
    const lines = document.getText().split(/\r?\n/);
    let currentOptionBlock;
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
        if (isTerminatorLine(line)) {
            currentOptionBlock = undefined;
            continue;
        }
        if (COMMAND_PATTERN.test(trimmedLine)) {
            continue;
        }
        const parsedLine = parseParameterLine(line);
        if (!parsedLine || !currentOptionBlock) {
            continue;
        }
        const paramName = parsedLine.name;
        const paramValueRaw = parsedLine.value;
        const paramValue = unquote(paramValueRaw);
        const parameter = (0, parameters_1.findParameter)(paramName, currentOptionBlock) ?? (0, parameters_1.findParameter)(paramName);
        if (!parameter) {
            const suggestions = getParameterSuggestions(paramName, currentOptionBlock);
            const suffix = suggestions.length > 0
                ? ` Did you mean: ${suggestions.join(', ')}?`
                : '';
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
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
                    severity: node_1.DiagnosticSeverity.Error,
                    range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
                    message: `Invalid value "${paramValue}" for parameter "${paramName}". Valid values: ${parameter.validValues.join(', ')}`
                });
            }
        }
        else if (parameter.type === 'number') {
            const isPlaceholder = /^\$\{[^}]+\}$/.test(paramValue);
            const numValue = Number(paramValue);
            if (!isPlaceholder && Number.isNaN(numValue)) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
                    message: `Invalid number value "${paramValueRaw}" for parameter "${paramName}"`
                });
            }
            else if (!Number.isNaN(numValue)) {
                if (parameter.minValue !== undefined && numValue < parameter.minValue) {
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Warning,
                        range: makeRange(lineNum, parsedLine.valueStart, parsedLine.valueEnd),
                        message: `Value ${numValue} is below minimum ${parameter.minValue} for parameter "${paramName}"`
                    });
                }
                if (parameter.maxValue !== undefined && numValue > parameter.maxValue) {
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Warning,
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
function sendDiagnostics(document) {
    const diagnostics = validateDocument(document);
    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Full,
            hoverProvider: true,
        }
    };
});
connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }
    const lines = document.getText().split(/\r?\n/);
    if (params.position.line < 0 || params.position.line >= lines.length) {
        return null;
    }
    const line = lines[params.position.line];
    const parsedLine = parseParameterLine(line);
    if (!parsedLine) {
        return null;
    }
    const isOnParameterName = params.position.character >= parsedLine.nameStart &&
        params.position.character <= parsedLine.nameEnd;
    const isOnParameterValue = params.position.character >= parsedLine.valueStart &&
        params.position.character <= parsedLine.valueEnd;
    if (!isOnParameterName && !isOnParameterValue) {
        return null;
    }
    const currentOptionBlock = getOptionBlockAtLine(lines, params.position.line);
    const parameter = currentOptionBlock
        ? (0, parameters_1.findParameter)(parsedLine.name, currentOptionBlock) ?? (0, parameters_1.findParameter)(parsedLine.name)
        : (0, parameters_1.findParameter)(parsedLine.name);
    if (!parameter) {
        return null;
    }
    return {
        range: makeRange(params.position.line, parsedLine.nameStart, parsedLine.nameEnd),
        contents: {
            kind: node_1.MarkupKind.Markdown,
            value: buildParameterHover(parameter),
        }
    };
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
//# sourceMappingURL=server.js.map