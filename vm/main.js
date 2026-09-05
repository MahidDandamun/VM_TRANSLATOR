import { Parser } from "./vm/parser.js";
import { CodeWriter } from "./vm/codeWriter.js";

const $ = (id) => document.getElementById(id);
const vmFile = $("vm_file");

$("pickBtn").addEventListener("click", () => {
	if ($("folderMode").checked) {
		vmFile.setAttribute("webkitdirectory", "");
	} else {
		vmFile.removeAttribute("webkitdirectory");
	}
	vmFile.click();
});

let instructions = [];
vmFile.addEventListener("change", async (e) => {
	const directoryFiles = e.target.files;

	const writer = new CodeWriter(instructions);
	const firstPath = directoryFiles[0]?.webkitRelativePath;
	writer.outputName = firstPath ? firstPath.split("/")[0] : "output";

	// Bootstrap (SP=256; call Sys.init) is only valid for programs that
	// actually define Sys.init -- a lone single-file arithmetic test
	// doesn't, so gate this behind the same "folderMode" checkbox for now.
	// Swap in a dedicated checkbox later if you want single files with
	// their own Sys.init to opt in too.
	if ($("folderMode").checked) {
		writer.writeInit();
	}

	for (const file of directoryFiles) {
		// each file from the FileList
		if (!file.name.endsWith(".vm")) continue;

		const raw = await file.text();
		const cleaned = raw
			.split("\n")
			.filter((line) => !line.includes("//") && line.trim() !== "")
			.map((line) => line.trim());

		const parser = new Parser(cleaned);
		writer.setFileName(file.name); // switch static context for this file

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

	writer.close(); // once, after every file has been translated
});
