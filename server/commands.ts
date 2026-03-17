export type TaraCommandCategory = 'command' | 'directive' | 'subcommand';

export interface TaraCommand {
  token: string;
  category: TaraCommandCategory;
  description: string;
  usage: string;
  completionSnippet?: string;
}

export const TARA_COMMANDS: TaraCommand[] = [
  {
    token: 'READ',
    category: 'command',
    description: 'Read input data (power flow case, subsystem, etc.).',
    usage: 'READ PSSE <version> "<case.raw>" 0',
    completionSnippet: 'READ PSSE ${1:30} "${2:case.raw}" 0'
  },
  {
    token: 'CONT',
    category: 'command',
    description: 'Read contingency file (inside solve block). Also used as `cont accont 0` to run contingency analysis.',
    usage: 'CONT "<case.con>"  |  cont accont 0',
    completionSnippet: 'CONT "${1:case.con}"'
  },
  {
    token: 'MONIT',
    category: 'command',
    description: 'Read monitored element file.',
    usage: 'MONIT "<case.mon>"',
    completionSnippet: 'MONIT "${1:case.mon}"'
  },
  {
    token: 'solve',
    category: 'command',
    description: 'Run load flow solution command group.',
    usage: 'solve fdec 0 0',
    completionSnippet: 'solve ${1:fdec} 0 0'
  },
  {
    token: 'fdec',
    category: 'subcommand',
    description: 'Fast decoupled AC load flow solution mode.',
    usage: 'solve fdec 0 0',
    completionSnippet: 'fdec 0 0'
  },
  {
    token: 'cont',
    category: 'command',
    description: 'Run contingency analysis (accont = AC, dccont = DC). Also used inside solve block as `CONT "<file>"` to load a contingency file.',
    usage: 'cont accont 0  |  cont dccont 0',
    completionSnippet: 'cont ${1|accont,dccont|} 0'
  },
  {
    token: 'lfreview',
    category: 'command',
    description: 'Generate load flow review reports.',
    usage: 'lfreview %save "<report.txt>" %csv <reportType> ...',
    completionSnippet: 'lfreview %save "${1:temp_report.txt}" %csv ${2:subsys} 0'
  },
  {
    token: 'warn',
    category: 'command',
    description: 'Generate warning summary/list reports.',
    usage: 'warn %save "<Warn_Sum.csv>" %csv sum 0 0',
    completionSnippet: 'warn %save "${1:Warn_Sum.csv}" %csv ${2:sum} 0 0'
  },
  {
    token: 'chdir',
    category: 'command',
    description: 'Change the working directory for subsequent file operations.',
    usage: 'chdir "<path>"',
    completionSnippet: 'chdir "${1:path/to/directory}"'
  },
  {
    token: 'trlim',
    category: 'command',
    description: 'Execute transfer limit analysis.',
    usage: 'trlim',
    completionSnippet: 'trlim'
  },
  {
    token: 'RPTManager',
    category: 'command',
    description: 'Configure report manager options (e.g., TrLim report fields).',
    usage: 'RPTManager TrLim',
    completionSnippet: 'RPTManager ${1:TrLim}'
  },
  {
    token: 'stop',
    category: 'command',
    description: 'Stop script execution.',
    usage: 'stop',
    completionSnippet: 'stop'
  },
  {
    token: 'help',
    category: 'command',
    description: 'Show available commands in current menu context.',
    usage: 'help',
    completionSnippet: 'help'
  },
  {
    token: '_excel',
    category: 'command',
    description: 'Signal token used by Excel/TARA automation flow.',
    usage: '_excel',
    completionSnippet: '_excel'
  },

  // Directives
  {
    token: '%trace',
    category: 'directive',
    description: 'Write execution log to file.',
    usage: '%trace "<logfile.txt>" %txt',
    completionSnippet: '%trace "${1:TARAlog.txt}" %txt'
  },
  {
    token: '%include',
    category: 'directive',
    description: 'Include another script file.',
    usage: '%include "Options_common.dir"',
    completionSnippet: '%include "${1:Options_common.dir}"'
  },
  {
    token: '%run',
    category: 'directive',
    description: 'Run another script file.',
    usage: '%run "ACCont.dir"',
    completionSnippet: '%run "${1:ACCont.dir}"'
  },
  {
    token: '%read',
    category: 'directive',
    description: 'Read another script/input file.',
    usage: '%read "input.txt"',
    completionSnippet: '%read "${1:input.txt}"'
  },
  {
    token: '%save',
    category: 'directive',
    description: 'Save report output to file (overwrite mode).',
    usage: '%save "<output.csv>"',
    completionSnippet: '%save "${1:output.csv}"'
  },
  {
    token: '%add',
    category: 'directive',
    description: 'Append report output to existing file.',
    usage: '%add "<output.csv>"',
    completionSnippet: '%add "${1:output.csv}"'
  },
  {
    token: '%csv',
    category: 'directive',
    description: 'Use CSV output format for report data.',
    usage: '%csv',
    completionSnippet: '%csv'
  },
  {
    token: '%txt',
    category: 'directive',
    description: 'Use text output format for report/log data.',
    usage: '%txt',
    completionSnippet: '%txt'
  },
  {
    token: '%exit',
    category: 'directive',
    description: 'Exit TARA script execution.',
    usage: '%exit',
    completionSnippet: '%exit'
  }
];

const COMMAND_LOOKUP_EXACT = new Map<string, TaraCommand>(
  TARA_COMMANDS.map(command => [command.token, command])
);

const COMMAND_LOOKUP_CASE_INSENSITIVE = new Map<string, TaraCommand[]>();
for (const command of TARA_COMMANDS) {
  const key = command.token.toLowerCase();
  const existing = COMMAND_LOOKUP_CASE_INSENSITIVE.get(key) ?? [];
  existing.push(command);
  COMMAND_LOOKUP_CASE_INSENSITIVE.set(key, existing);
}

export function findCommand(token: string): TaraCommand | undefined {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return undefined;
  }

  const exactMatch = COMMAND_LOOKUP_EXACT.get(normalizedToken);
  if (exactMatch) {
    return exactMatch;
  }

  const caseInsensitiveMatches = COMMAND_LOOKUP_CASE_INSENSITIVE.get(normalizedToken.toLowerCase());
  if (!caseInsensitiveMatches || caseInsensitiveMatches.length === 0) {
    return undefined;
  }

  return caseInsensitiveMatches[0];
}

export function getCommandsForCompletion(prefix = ''): TaraCommand[] {
  const normalizedPrefix = prefix.trim().toLowerCase();

  const filtered = normalizedPrefix
    ? TARA_COMMANDS.filter(command => command.token.toLowerCase().startsWith(normalizedPrefix))
    : TARA_COMMANDS;

  return filtered.slice().sort((left, right) => left.token.localeCompare(right.token));
}
