import { Parser as AsmParser } from "../asm/SL_ASSEMBLER/parser.js";
import { Code as AsmCode } from "../asm/SL_ASSEMBLER/code.js";
import { SymbolTable } from "../asm/SL_ASSEMBLER/symbol_table.js";

import { Parser as VmParser } from "../vm/parser.js";
import { CodeWriter } from "../vm/codeWriter.js";
import path from "path";

function translateAsmText(rawText) {
	const cleaned = rawText
		.split("\n")
		.filter((str) => !str.includes("//") && str.trim() !== "")
		.map((s) => s.trim());

	const parser = new AsmParser(cleaned);
	const code = new AsmCode();
	const symbolTable = new SymbolTable();
	let instructions = [];

	let romIndex = -1;
	while (parser.hasMoreCommands()) {
		parser.advance();
		if (["A_COMMAND", "C_COMMAND"].includes(parser.commandType())) romIndex++;
		if (parser.commandType() === "L_COMMAND" && !symbolTable.contains(parser.symbol())) {
			symbolTable.addEntry(parser.symbol(), romIndex + 1);
		}
	}
	parser.resetIndex();
	while (parser.hasMoreCommands()) {
		parser.advance();
		switch (parser.commandType()) {
			case "C_COMMAND":
				instructions.push(
					"111" + code.comp(parser.comp()) + code.dest(parser.dest()) + code.jump(parser.jump()),
				);
				break;
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
				instructions.push(binarySym.padStart(16, "0"));
				break;
			}
			default:
				break;
		}
	}
	return instructions.join("\n");
}

function toBinary(num) {
	return Number(num).toString(2);
}
function isNonNegativeNumber(str) {
	return String(str).trim() !== "" && !Number.isNaN(Number(str)) && Number(str) >= 0;
}

function translateVmText(texts, folderMode = false) {
	const instructions = [];
	const writer = new CodeWriter(instructions);
	writer.outputName = "output";
	if (folderMode) writer.writeInit();

	for (const file of texts) {
		const cleaned = file
			.split("\n")
			.filter((line) => !line.includes("//") && line.trim() !== "")
			.map((l) => l.trim());
		const parser = new VmParser(cleaned);
		writer.setFileName(file.name || "file.vm");
		while (parser.hasMoreCommands()) {
			parser.advance();
			const type = parser.commandType();
			if (type === "C_ARITHMETIC") writer.writeArithmetic(parser.arg1());
			else if (type === "C_PUSH" || type === "C_POP") writer.writePushPop(type, parser.arg1(), parser.arg2());
			else if (type === "C_LABEL") writer.writeLabel(parser.arg1());
			else if (type === "C_GOTO") writer.writeGoto(parser.arg1());
			else if (type === "C_IF") writer.writeIf(parser.arg1());
			else if (type === "C_FUNCTION") writer.writeFunction(parser.arg1(), parser.arg2());
			else if (type === "C_CALL") writer.writeCall(parser.arg1(), parser.arg2());
			else if (type === "C_RETURN") writer.writeReturn();
		}
	}
	return instructions.join("\n");
}

// Samples
const asmSample = `// Simple add\n@2\nD=A\n@3\nD=D+A\n@0\nM=D`;
const asmOut = translateAsmText(asmSample);
console.log("=== ASM Output ===");
console.log(asmOut);

const vmSample = `push constant 2\npush constant 3\nadd`;
const vmOut = translateVmText(["push constant 2\npush constant 3\nadd"]);
console.log("\n=== VM Output ===");
console.log(vmOut);

console.log("\nDone");
