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

Planned Scope:
* .log (Log files)

## Requirements


## Extension Settings


## Known Issues

BUSNAMES, BUSNUMBERS, BRANCHNAMES will not work when nested inside other definition blocks. Add them before or after definition blocks to eliminate false. Cross file support is also not included, so it is required to put these near the beginning of a file if you deviate from teh default of BUSNUMBERS



## Release Notes

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

