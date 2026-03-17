# powergem-vscode README

* [PowerGEM](https://www.power-gem.com/) PROBE & TARA input and output langugage grammars

    Issues can be reported [here](https://github.com/PowerGem/VSCodeExtension/issues).

## Features

Supported Formats:
* .dir (TARA Directive files) - **with Language Server validation**
* .mon (Monitor files)
* .con (Contingency files)
* .sub (Subsystem files)
* .inch (Interconnection Change files)
* _comm (PGScript files)

Supported Python Libraries:
* **pyTARA API** – 50+ code snippets and full IntelliSense with method signatures, parameter hints, and documentation

TARA Directive (.dir) IDE Features:
* Real-time validation diagnostics for parameters and command arguments
* Hover support for parameters, commands, and directives
* IntelliSense for:
  * Command/directive tokens
  * Command argument values (modes, formats, report types, common path placeholders)
  * Option block headers (`opt`, `lfopt`, `RPTManager`)
  * Parameter names and value snippets (including enum choices and trailing inline comments)
* Quick fixes for common command issues (invalid token values, missing required tokens, unquoted file paths)
* 50+ code snippets for TARA option blocks and command workflows
* 150+ parameter definitions from TARA 2601 Manual metadata
* Expanded syntax highlighting for directive commands, AMB section labels, and parameter lines

Planned Scope:
* .log (Log files)
* Cross-file validation for `%include` / `%run` inputs
* Additional formatting/code actions for large directive scripts

## Requirements


## Extension Settings


## Known Issues

BUSNAMES, BUSNUMBERS, BRANCHNAMES will not work when nested inside other definition blocks. Add them before or after definition blocks to eliminate false. Cross file support is also not included, so it is required to put these near the beginning of a file if you deviate from teh default of BUSNUMBERS



## Release Notes

### Unreleased

### 1.0.1

- Added command-aware language server IntelliSense for `.dir` files:
  - argument-aware completions for `READ`, `solve`, `cont`, `lfreview`, `warn`, `trlim`, and `%` directives
  - command argument diagnostics with quick fixes
- Improved parameter completion snippets to include trailing inline comments
- Expanded `.dir` snippets for `lfreview`, `warn`, `trlim`, `opt trlim`, and `RPTManager TrLim`
- Updated `.dir` syntax highlighting for more command tokens, `%exit`, AMB section labels, and parameter lines without required leading indentation

Comprehensive TARA Directive (.dir) file support with IDE validation:
- **Language Server Phase 1**: Real-time validation diagnostics for .dir files including:
  - Parameter name validation (warns on unknown parameters)
  - Type checking (validates numeric vs string values)
  - Enum validation (checks valid values for options like monBranRatingBase)
  - Range checking (warns if numeric values exceed min/max constraints)
  - Smart parsing that handles comments, empty lines, and command syntax correctly
- Complete syntax highlighting for directive files and options blocks
- 50+ code snippets for all TARA option categories including:
  - opt cont, opt EMS, opt screen (contingency analysis, EMS, and screening options)
  - lfopt solve, lfopt adj, lfopt misc (load flow options)
  - opt sced options (economic dispatch parameters)
  - opt amb (multi-snapshot analysis with 6 subsections)
- Full parameter documentation from TARA 2601 Manual with 100+ parameters in metadata database
- Support for all directive file commands and syntax
- See [LANGUAGE_SERVER_SETUP.md](LANGUAGE_SERVER_SETUP.md) for building and testing the Language Server

### 0.8.0

Comprehensive TARA Directive (.dir) file support with IDE validation:
- **Language Server Phase 1**: Real-time validation diagnostics for .dir files including:
  - Parameter name validation (warns on unknown parameters)
  - Type checking (validates numeric vs string values)
  - Enum validation (checks valid values for options like monBranRatingBase)
  - Range checking (warns if numeric values exceed min/max constraints)
  - Smart parsing that handles comments, empty lines, and command syntax correctly
- Complete syntax highlighting for directive files and options blocks
- 50+ code snippets for all TARA option categories including:
  - opt cont, opt EMS, opt screen (contingency analysis, EMS, and screening options)
  - lfopt solve, lfopt adj, lfopt misc (load flow options)
  - opt sced options (economic dispatch parameters)
  - opt amb (multi-snapshot analysis with 6 subsections)
- Full parameter documentation from TARA 2601 Manual Appendix A
- Support for all directive file commands and syntax

### 0.7.0

Added support for Added pyTARA support for syntax highlighting as well as pylance autocomplete

### 0.6.0

Added support for INCH (Incremental Change) syntax highlighting and folding

### 0.5.0

Added support for Automatic contingencies lists

### 0.4.0

Significant CTG file supported added for outage/contingency with snippets

### 0.3.0

Implemented most of the _comm file, currently only configured for MISO or PJM
To switch to a TARA based menu add '//>TARAMNEU' to the beginning of a file

### 0.2.0

most of '.sub' implemented


### 0.1.0

First Draft - most of '.mon' and some of '.con' is implemented

