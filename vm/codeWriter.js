export class CodeWriter {
	constructor(instructions) {
		this.instructions = instructions;
		this.currentFunction = ""; // tracks which function we're inside, for label scoping
	}
	setFileName(fileName) {
		this.fileName = fileName.replace(/\.vm$/, "").split("/").pop();
	}
	writeArithmetic(command) {
		const twoStackOps = ["@SP", "AM=M-1", "D=M", "A=A-1"];
		const unaryOps = ["@SP", "A=M-1"];
		const arith = ["add", "sub", "neg"];
		const boolean = ["and", "or", "not"];
		const equality = ["eq", "lt", "gt"];

		if (arith.includes(command)) {
			let arithCommand = command === "add" ? "M=D+M" : command === "sub" ? "M=M-D" : "M=-M";
			if (command === "neg") this.emit(...unaryOps, arithCommand);
			this.emit(...twoStackOps, arithCommand);
		} else if (boolean.includes(command)) {
			let boolCommand = command === "and" ? "M=D&M" : command === "or" ? "M=D|M" : "M=!M";
			if (command === "not") this.emit(...unaryOps, boolCommand);
			this.emit(...twoStackOps, boolCommand);
		} else if (equality.includes(command)) {
			this.compCount = (this.compCount ?? 0) + 1;
			const n = this.compCount;
			let equalityCommand = command === "eq" ? "D;JEQ" : command === "lt" ? "D;JLT" : "D;JGT";
			this.emit(
				...twoStackOps,
				"D=M-D",
				`@TRUE_${n}`,
				equalityCommand,
				...unaryOps,
				"M=0",
				`@END_${n}`,
				"0;JMP",
				`(TRUE_${n})`,
				...unaryOps,
				"M=-1",
				`(END_${n})`,
			);
		}
	}
	writePushPop(command, segment, index) {
		if (command === "C_PUSH") {
			this.writePush(segment, index);
		} else {
			this.writePop(segment, index);
		}
	}
	writePop(segment, index) {
		if (["local", "argument", "this", "that"].includes(segment)) {
			this.emit(`@${this.segmentPointer(segment)}`, "D=M", `@${index}`, "D=A+D");
		} else if (segment === "temp") {
			this.emit(`@${5 + index}`, "D=A");
		} else if (segment === "pointer") {
			this.emit(`@${index === 0 ? "THIS" : "THAT"}`, "D=A");
		} else if (segment === "static") {
			this.emit(`@${this.fileName}.${index}`, "D=A");
		}

		this.emit("@R13", "M=D"); // stash target address
		this.emit("@SP", "AM=M-1", "D=M"); // pop value into D
		this.emit("@R13", "A=M", "M=D"); // write D into the stashed address
	}
	writePush(segment, index) {
		if (segment === "constant") {
			this.emit(`@${index}`, "D=A");
		} else if (segment === "temp") {
			this.emit(`@${5 + index}`, "D=M");
		} else if (["local", "argument", "this", "that"].includes(segment)) {
			this.emit(`@${this.segmentPointer(segment)}`, "D=M", `@${index}`, "A=D+A", "D=M");
		} else if (segment === "pointer") {
			this.emit(`@${index === 0 ? "THIS" : "THAT"}`, "D=M");
		} else if (segment === "static") {
			this.emit(`@${this.fileName}.${index}`, "D=M");
		}
		this.pushD();
	}

	// ===== Program flow (Chapter 8) =====

	// Labels are scoped to the enclosing function so "label loop" in
	// two different functions doesn't collide on the same symbol.
	// At the top level (no enclosing function), the bare label is used.
	scopedLabel(label) {
		return this.currentFunction ? `${this.currentFunction}$${label}` : label;
	}
	writeLabel(label) {
		this.emit(`(${this.scopedLabel(label)})`);
	}
	writeGoto(label) {
		this.emit(`@${this.scopedLabel(label)}`, "0;JMP");
	}
	writeIf(label) {
		// pop the top of the stack into D, jump if it's not 0 (i.e. "true" = -1)
		this.emit("@SP", "AM=M-1", "D=M", `@${this.scopedLabel(label)}`, "D;JNE");
	}

	// ===== Function calling (Chapter 8) =====

	writeFunction(functionName, numLocals) {
		this.currentFunction = functionName;
		this.emit(`(${functionName})`);
		// push numLocals zeros to initialize the local segment
		for (let i = 0; i < numLocals; i++) {
			this.emit("@0", "D=A");
			this.pushD();
		}
	}
	writeCall(functionName, numArgs) {
		this.callCount = (this.callCount ?? 0) + 1;
		const returnLabel = `${functionName}$ret.${this.callCount}`;

		// push return address
		this.emit(`@${returnLabel}`, "D=A");
		this.pushD();
		// push LCL, ARG, THIS, THAT (caller's frame, saved for writeReturn to restore)
		for (const seg of ["LCL", "ARG", "THIS", "THAT"]) {
			this.emit(`@${seg}`, "D=M");
			this.pushD();
		}
		// ARG = SP - numArgs - 5   (repositions ARG to the start of the pushed args)
		this.emit("@SP", "D=M", `@${numArgs + 5}`, "D=D-A", "@ARG", "M=D");
		// LCL = SP   (callee's locals will start being pushed right here)
		this.emit("@SP", "D=M", "@LCL", "M=D");
		// transfer control
		this.emit(`@${functionName}`, "0;JMP");
		this.emit(`(${returnLabel})`);
	}
	writeReturn() {
		// FRAME (R13) = LCL -- a temporary pointer to the caller's saved frame
		this.emit("@LCL", "D=M", "@R13", "M=D");
		// RET (R14) = *(FRAME-5) -- save the return address BEFORE anything
		// below overwrites it (matters when numArgs is 0, since *ARG = ...
		// could otherwise clobber it)
		this.emit("@R13", "D=M", "@5", "A=D-A", "D=M", "@R14", "M=D");
		// *ARG = pop()  -- reposition the return value where the caller can see it
		this.emit("@SP", "AM=M-1", "D=M", "@ARG", "A=M", "M=D");
		// SP = ARG + 1  -- caller's stack now ends right after the return value
		this.emit("@ARG", "D=M+1", "@SP", "M=D");
		// restore THAT, THIS, ARG, LCL by walking FRAME backward one slot at a time
		this.emit("@R13", "AM=M-1", "D=M", "@THAT", "M=D");
		this.emit("@R13", "AM=M-1", "D=M", "@THIS", "M=D");
		this.emit("@R13", "AM=M-1", "D=M", "@ARG", "M=D");
		this.emit("@R13", "AM=M-1", "D=M", "@LCL", "M=D");
		// goto RET
		this.emit("@R14", "A=M", "0;JMP");
	}

	// Bootstrap code: sets SP=256 and calls Sys.init. Emit this once,
	// before any translated file's instructions, only when the program
	// actually defines Sys.init (a lone Project 7 test file doesn't).
	writeInit() {
		this.emit("@256", "D=A", "@SP", "M=D");
		this.writeCall("Sys.init", 0);
	}

	// Shared push tail: writes D to the current top of stack and bumps SP.
	pushD() {
		this.emit("@SP", "A=M", "M=D", "@SP", "M=M+1");
	}

	emit(...lines) {
		this.instructions.push(...lines);
	}
	segmentPointer(segment) {
		return { local: "LCL", argument: "ARG", this: "THIS", that: "THAT" }[segment];
	}
	close() {
		const asmText = this.instructions.join("\n");
		const blob = new Blob([asmText], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${this.outputName || "output"}.asm`;
		a.click();
		URL.revokeObjectURL(url);
	}
}
