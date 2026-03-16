# powergem-vscode README

* [PowerGEM](https://www.power-gem.com/) PROBE & TARA input and output langugage grammars

    Issues can be reported [here](https://github.com/PowerGem/VSCodeExtension/issues).

## Features

Supported Formats:
* .mon (Monitor files)
* .con (Contingency files)
* .sub (Subsystem files)
* .inch (Interconnection Change files)
* _comm (PGScript files)

Supported Python Libraries:
* **pyTARA API** – 50+ code snippets and full IntelliSense with method signatures, parameter hints, and documentation

Planned Scope:
* .log (Log files)

## Requirements


## Extension Settings


## Known Issues

BUSNAMES, BUSNUMBERS, BRANCHNAMES will not work when nested inside other definition blocks. Add them before or after definition blocks to eliminate false. Cross file support is also not included, so it is required to put these near the beginning of a file if you deviate from teh default of BUSNUMBERS



## Release Notes

### 0.8.0

Comprehensive TARA Directive (.dir) file support:
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

