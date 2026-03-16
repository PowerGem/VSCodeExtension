# Change Log

All notable changes to the "powergem-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.8.0]

- Added comprehensive .dir (TARA Directive) file support with full syntax highlighting
- Implemented 50+ code snippets covering all TARA option parameter blocks:
  - `opt cont` - Contingency analysis parameters (monBranRatingBase, contChanCutOffMW, etc.)
  - `lfopt solve` - Load flow solver options with 20+ parameters
  - `lfopt adj` - Load flow adjustment parameters (PAR, TAP, shunt adjustments)
  - `lfopt misc` - Miscellaneous LF parameters and branch naming options
  - `opt sced options` - Security-Constrained Economic Dispatch parameters
  - `opt amb` - Multi-snapshot analysis with subsections (general, param, hourly, long, ems)
  - `opt EMS`, `opt screen` - EMS and screening options
  - `opt misc` - Reporting and output options
- All parameters sourced from TARA 2601 Manual with accurate default values and descriptions
- Supports directive file structure with %include, %trace, commands, and options blocks

## [0.7.0]

- Added comprehensive pyTARA Python API support:
  - 50+ code snippets for common operations
  - Full IntelliSense via `pyTARA.pyi` type stub with all 115+ API methods
  - Method signatures, parameter hints, and documentation
  - Works with Pylance without requiring pyPowerGEM installation

## [0.6.0]

- Added comprehensive support for .inch (Interconnection Change) files with full syntax highlighting
- Implemented highlighting for all 57+ INCH commands including ADD, DELETE, MODIFY, COPY, MOVE, MERGE, SPLIT, TAP, SUBSYSTEM, SCALE, PURGE, WRITE, and SOLVE_FDEC operations
- Added code folding and indentation rules for INCH command blocks

