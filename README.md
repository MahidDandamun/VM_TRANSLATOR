# VM Translator Mini Project

A small translator project for the Hack VM language and related assembly tooling. The project is inspired by the classic nand2tetris VM Translator, but this version also includes a lightweight browser UI for testing and previewing generated assembly.

## What this project does

The repository can:

- parse VM commands such as `push`, `pop`, arithmetic ops, labels, and function calls
- translate them into Hack assembly instructions
- handle the stack discipline required by the VM specification
- support basic program flow constructs like labels, `goto`, and `if-goto`
- translate Hack assembly text into machine code through the assembler utilities in `asm/SL_ASSEMBLER`

## Project structure

```text
VM_TRANSLATOR/
├── asm/
│   └── SL_ASSEMBLER/       # Hack assembly assembler utilities
├── scripts/
│   └── test_translations.mjs # sample translation checks
├── ui/                      # React + Vite browser interface
├── vm/
│   ├── parser.js            # VM parser
│   └── codeWriter.js        # translation logic to Hack assembly
└── README.md
```

## Features

- Arithmetic: `add`, `sub`, `neg`, `eq`, `lt`, `gt`, `and`, `or`, `not`
- Memory segments: `constant`, `local`, `argument`, `this`, `that`, `pointer`, `temp`, `static`
- Control flow: `label`, `goto`, `if-goto`
- Function support: `function`, `call`, `return`
- Bootstrap support for Sys.init-style startup flow
- Browser-based UI for using the translator without a terminal

## Quick start

### Run the UI

```bash
cd VM_TRANSLATOR/ui
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

### Run the sample translation script

From the project root:

```bash
cd VM_TRANSLATOR
node scripts/test_translations.mjs
```

This executes a few example translation checks to confirm the VM and assembly translation flow works as expected.

## Example VM input

```text
push constant 2
push constant 3
add
```

This translates into corresponding Hack assembly instructions that operate on the VM stack.

## Notes

This is a mini project focused on learning and experimenting with the VM translator pipeline. It is intentionally lightweight and easy to inspect, making it useful for understanding how a VM-to-assembly compiler is structured.

## Future ideas

- add file upload support for `.vm` source files
- improve the UI with better validation and output download handling
- add a more complete test suite for edge cases
- expand documentation around each translator phase

## License

This project is for educational and personal development use unless otherwise noted in the repository.
