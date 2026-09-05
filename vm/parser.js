export class Parser {
	constructor(instructions) {
		this.index = -1;
		this.currentCommand = null;
		this.instructions = instructions;
		this.aCommands = ["add", "sub", "neg", "and", "or", "not", "eq", "lt", "gt"];
		this.oCommands = {
			push: "C_PUSH",
			pop: "C_POP",
			label: "C_LABEL",
			goto: "C_GOTO",
			if_goto: "C_IF",
			function: "C_FUNCTION",
			call: "C_CALL",
			return: "C_RETURN",
		};
	}
	hasMoreCommands() {
		return this.instructions.length - 1 > this.index;
	}
	advance() {
		this.index++;
		this.currentCommand = this.instructions[this.index];
		this.operand = this.currentCommand.split(" ");
	}
	commandType() {
		if (this.aCommands.includes(this.operand[0])) return "C_ARITHMETIC";
		return this.oCommands[this.operand[0]] || null;
	}
	arg1() {
		if (this.commandType() === "C_RETURN") return;
		else if (this.commandType() === "C_ARITHMETIC") return this.operand[0];
		return this.operand[1];
	}
	arg2() {
		if (["C_PUSH", "C_POP", "C_FUNCTION", "C_CALL"].includes(this.commandType())) return Number(this.operand[2]);
	}
}
