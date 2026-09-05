import { Parser } from "../../../../vm/parser.js";
import { CodeWriter } from "../../../../vm/codeWriter.js";

export async function translateVm(files: { name: string; text: string }[], folderMode = false) {
	const instructions: string[] = [];
	const writer = new CodeWriter(instructions);

	const firstPath = files[0]?.name || "";
	writer.outputName = firstPath ? firstPath.split("/")[0] : "output";

	if (folderMode) {
		writer.writeInit();
	}

	for (const file of files) {
		if (!file.name.endsWith(".vm")) continue;

		const cleaned = file.text
			.split("\n")
			.filter((line) => !line.includes("//") && line.trim() !== "")
			.map((line) => line.trim());

		const parser = new Parser(cleaned);
		writer.setFileName(file.name);

		while (parser.hasMoreCommands()) {
			parser.advance();
			const type = parser.commandType();
			if (type === "C_ARITHMETIC") {
				writer.writeArithmetic(parser.arg1());
			} else if (type === "C_PUSH" || type === "C_POP") {
				writer.writePushPop(type, parser.arg1(), parser.arg2());
			} else if (type === "C_LABEL") {
				writer.writeLabel(parser.arg1());
			} else if (type === "C_GOTO") {
				writer.writeGoto(parser.arg1());
			} else if (type === "C_IF") {
				writer.writeIf(parser.arg1());
			} else if (type === "C_FUNCTION") {
				writer.writeFunction(parser.arg1(), parser.arg2());
			} else if (type === "C_CALL") {
				writer.writeCall(parser.arg1(), parser.arg2());
			} else if (type === "C_RETURN") {
				writer.writeReturn();
			}
		}
	}

	const asmText = writer.instructions.join("\n");
	const fileName = `${writer.outputName || "output"}.asm`;
	return { output: asmText, fileName };
}
