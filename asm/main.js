import { Parser } from "./SL_ASSEMBLER/parser.js";
import { Code } from "./SL_ASSEMBLER/code.js";
import { SymbolTable } from "./SL_ASSEMBLER/symbol_table.js";
const $ = (id) => document.getElementById(id);
const input = $("asm_file");

let instructions = [];
let binaryCode = [];
input.addEventListener("change", async (e) => {
	let rawInstructions = await getFile(e);
	let romIndex = -1;
	const parser = new Parser(rawInstructions);
	const code = new Code();
	const symbolTable = new SymbolTable();

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
				const binaryComp =
					"111" + code.comp(parser.comp()) + code.dest(parser.dest()) + code.jump(parser.jump());
				instructions.push(binaryComp);
				break;
			case "A_COMMAND":
				let binarySym = "";
				//variable symbol check
				if (!symbolTable.contains(parser.symbol()) && !isNonNegativeNumber(parser.symbol())) {
					let nextAddress = symbolTable.nextFreeAddress();
					symbolTable.addEntry(parser.symbol(), nextAddress);
				}
				//number symbol
				if (isNonNegativeNumber(parser.symbol())) {
					binarySym = toBinary(parser.symbol());
				}
				// label symbol
				else {
					binarySym = toBinary(symbolTable.getAddress(parser.symbol()));
				}

				const binaryAddr = binarySym.padStart(16, "0");
				instructions.push(binaryAddr);
				break;
			default:
				break;
		}
	}
	binaryCode = instructions.join("\n");
	downloadFile(binaryCode, "project6.hack")
});
function toBinary(num) {
	return Number(num).toString(2);
}

function isNonNegativeNumber(str) {
	return str.trim() !== "" && !Number.isNaN(Number(str)) && Number(str) >= 0;
}

async function getFile(e) {
	const file = e.target.files[0];
	const text = await file.text();
	const instructions = text
		.split("\n")
		.filter((str) => !str.includes("//") && str !== "")
		.map((str) => str.trim());
	return instructions;
}

function downloadFile(content, fileName) {
	// Create a blob from the content
	const blob = new Blob([content], { type: "text/plain" });

	// Create a temporary link element
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = fileName;

	// Trigger the download
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
