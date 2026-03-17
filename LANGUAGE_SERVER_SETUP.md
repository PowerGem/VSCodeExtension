# TARA Directive Language Server Setup

## Overview

Phase 1 of the Language Server adds **diagnostic validation** for TARA `.dir` files. This includes:
- Parameter name validation (warns on unknown parameters)
- Type checking (validates numeric vs string values)
- Enum validation (checks valid values for boolean-like parameters)
- Range checking (warns if numeric values exceed min/max constraints)

## File Structure

```
src/
  extension.ts              # Main extension activation and server management
server/
  server.ts                 # Language Server implementation with diagnostics
  parameters.ts             # Parameter metadata database (100+ parameters)
  tsconfig.json            # TypeScript config for server compilation
tsconfig.json              # TypeScript config for extension compilation
```

## Installation & Building

### Prerequisites
- Node.js 16+ (included in VS Code or install separately)
- npm (comes with Node.js)

### Steps

1. **Install dependencies**:
   ```bash
   cd /Users/liamschubert/Documents/VSCodeExtension-main
   npm install
   ```

2. **Compile TypeScript to JavaScript**:
   ```bash
   npm run compile
   ```
   
   This will create:
   - `out/src/extension.js` (main extension)
   - `server/out/server.js` (language server)
   - `server/out/parameters.js` (parameter metadata)

3. **Watch for changes during development** (optional):
   ```bash
   npm run watch
   ```

## Testing

### Using VS Code's Extension Environment

1. Open the extension folder in VS Code:
   ```bash
   code /Users/liamschubert/Documents/VSCodeExtension-main
   ```

2. Press **F5** to launch the Extension Development Host (a new VS Code window)

3. Open or create a `.dir` file in the development window

4. The Language Server should automatically activate when you edit the file

5. Errors and warnings will appear as:
   - Red squiggles (errors - type mismatches)
   - Yellow squiggles (warnings - unknown parameters, range issues)
   - Hover over the underline to see the full error message

### Testing Scenarios

**Test 1: Unknown Parameter**
```
opt cont
unknownParam 5 // Should warn: "Unknown parameter"
0 0
```

**Test 2: Invalid Enum Value**
```
opt cont
monBranRatingBase 99  // Should error: "Invalid value '99', valid values: 1, 2, 3"
0 0
```

**Test 3: Type Mismatch (Number Expected)**
```
opt cont
contChanCutOffMW notANumber  // Should error: "Invalid number value"
0 0
```

**Test 4: Range Validation**
```
opt amb
FirstHourPeak 25  // Should warn: "Value 25 exceeds maximum 23"
0
```

## Features Implemented (Phase 1)

### Diagnostics
- ✅ Unknown option block detection
- ✅ Unknown parameter detection
- ✅ Type validation (number vs string)
- ✅ Enum value validation
- ✅ Numeric range checking (min/max)
- ✅ Smart line parsing (skips comments, empty lines, commands)

### Architecture
- ✅ Parameter metadata database (100+ parameters from TARA 2601 Manual)
- ✅ Modular validation engine (easy to extend)
- ✅ Correct Language Server Protocol setup
- ✅ Proper error/warning severity levels

## Future Phases

Phase 2 (Hover Information):
- Show parameter documentation on hover
- Display default values
- Show valid value ranges

Phase 3 (Autocomplete):
- Suggest known parameters within option blocks
- Suggest valid enum values
- Auto-complete option block names

Phase 4 (Advanced Features):
- Go-to-definition for included files
- Find all references
- Code folding
- Quick fixes for common errors

## Troubleshooting

### Extension won't activate
1. Check that `.dir` files are recognized as language `pg.dir`:
   - Open a `.dir` file
   - Look at bottom-right of VS Code for language indicator
   - Should show "TARA Directive" or "pg.dir"

2. Check Extension Development Host debug console for errors:
   - Use `Ctrl+Shift+J` or `View > Debug Console`

### No diagnostics appearing
1. Ensure you've run `npm run compile`
2. Reload the Extension Development Host window (`Ctrl+R`)
3. Check that the `.dir` file syntax is correct (not malformed)

### Diagnostics are incorrect
1. Check the parameter name spelling in parameters.ts
2. Ensure numeric values are valid JavaScript numbers
3. Review the validation logic in server.ts

## Building for Release

When ready to package as a `.vsix` file:

```bash
npm run compile
npm install -g vsce
vsce package
```

This creates `powergem-vscode-0.8.1.vsix` (or next version number) that includes the compiled JavaScript but excludes TypeScript source files.

## Debug Mode

To debug the Language Server (breakpoints, etc.):

1. Launch Extension Development Host (F5)
2. The server will be started with `--inspect=6009`
3. In a separate terminal, use Node's debugger:
   ```bash
   node --inspect-brk server/out/server.js
   ```

## Performance Notes

- Validation runs on every keystroke (full document re-validation)
- Performance is good for typical .dir files (<10,000 lines)
- Diagnostic limit capped at 100 errors to prevent UI slowdown
- Consider incremental validation if dealing with very large files future

## References

- TARA 2601 Manual: Appendix A.1 (Sample _comm.txt) and Appendix A.2 (Options_common.dir)
- Parameter metadata sourced from manual sections 18980-19110
- VS Code Language Server documentation: https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
