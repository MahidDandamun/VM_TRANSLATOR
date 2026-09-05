import { Parser } from "../../../../asm/SL_ASSEMBLER/parser.js";
import { Code } from "../../../../asm/SL_ASSEMBLER/code.js";
import { SymbolTable } from "../../../../asm/SL_ASSEMBLER/symbol_table.js";

export function translateAsm(rawText: string, outputName = "project6.hack") {
	const cleaned = rawText
		.split("\n")
		.filter((str) => !str.includes("//") && str.trim() !== "")
		.map((s) => s.trim());

	const parser = new Parser(cleaned);
	const code = new Code();
	const symbolTable = new SymbolTable();
	let instructions: string[] = [];

	// First pass: label symbols
	let romIndex = -1;
	while (parser.hasMoreCommands()) {
		parser.advance();
		if (["A_COMMAND", "C_COMMAND"].includes(parser.commandType())) romIndex++;

		if (parser.commandType() === "L_COMMAND" && !symbolTable.contains(parser.symbol())) {
			symbolTable.addEntry(parser.symbol(), romIndex + 1);
		}
	}

	// Second pass: translate
	parser.resetIndex();
	while (parser.hasMoreCommands()) {
		parser.advance();
		switch (parser.commandType()) {
			case "C_COMMAND": {
				const binaryComp =
					"111" + code.comp(parser.comp()) + code.dest(parser.dest()) + code.jump(parser.jump());
				instructions.push(binaryComp);
				break;
			}
			case "A_COMMAND": {
				let binarySym = "";
				if (!symbolTable.contains(parser.symbol()) && !isNonNegativeNumber(parser.symbol())) {
					let nextAddress = symbolTable.nextFreeAddress();
					symbolTable.addEntry(parser.symbol(), nextAddress);
				}
				if (isNonNegativeNumber(parser.symbol())) {
					binarySym = toBinary(parser.symbol());
				} else {
					binarySym = toBinary(symbolTable.getAddress(parser.symbol()));
				}
				const binaryAddr = binarySym.padStart(16, "0");
				instructions.push(binaryAddr);
				break;
			}
			default:
				break;
		}
	}

	return { output: instructions.join("\n"), fileName: outputName };
}

function toBinary(num: any) {
	return Number(num).toString(2);
}

function isNonNegativeNumber(str: any) {
	return String(str).trim() !== "" && !Number.isNaN(Number(str)) && Number(str) >= 0;
}
