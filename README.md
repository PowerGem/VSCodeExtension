# powergem-vscode README

* [PowerGEM](https://www.power-gem.com/) PROBE & TARA input and output langugage grammars

    If you find issues, you can send files djohnsonbaugh@power-gem.com for evaluation

## Features

This is a work in progress, currently most '.mon' features are handled.
Planned Scope:
.mon
.con
.sub
_comm
.log

## Requirements


## Extension Settings


## Known Issues

BUSNAMES, BUSNUMBERS, BRANCHNAMES will not work when nested inside other definition blocks. Add them before or after definition blocks to eliminate false. Cross file support is also not included, so it is required to put these near the beginning of a file if you deviate from teh default of BUSNUMBERS



## Release Notes

### 0.4.0

Significant CTG file supported added for outage/contingency with snippets

### 0.3.0

Implemented most of the _comm file, currently only configured for MISO or PJM
To switch to a TARA based menu add '//>TARAMNEU' to the beginning of a file

### 0.2.0

most of '.sub' implemented


### 0.1.0

First Draft - most of '.mon' and some of '.con' is implemented

