export class Parser {
	constructor(instructions) {
		this.current_command = null;
		this.instructions = instructions;
		this.index = -1;
	}
	resetIndex() {
		this.index = -1;
	}
	hasMoreCommands() {
		return this.instructions.length - 1 > this.index;
	}
	advance() {
		this.index++;
		this.current_command = this.instructions[this.index];
	}
	commandType() {
		if (this.current_command.startsWith("(")) return "L_COMMAND";
		if (this.current_command.startsWith("@")) return "A_COMMAND";
		return "C_COMMAND";
	}
	symbol() {
		if (["A_COMMAND", "L_COMMAND"].includes(this.commandType())) {
			return this.commandType() === "A_COMMAND"
				? this.current_command.split("@")[1]
				: this.current_command.slice(1, -1);
		}
		console.log(`This command is of type ${this.commandType()}`);
		return;
	}
	dest() {
		if (this.commandType() !== "C_COMMAND") {
			console.log("The command should be type C");
			return;
		}
		if (!this.current_command.includes("=")) return "null";
		return this.current_command.split("=")[0];
	}
	comp() {
		if (this.commandType() !== "C_COMMAND") {
			console.log("The command should be type C");
			return;
		}
		return this.current_command.includes("=")
			? this.current_command.split("=")[1]
			: this.current_command.split(";")[0];
	}
	jump() {
		if (this.commandType() !== "C_COMMAND") {
			console.log("The command should be type C");
			return;
		}
		if (!this.current_command.includes(";")) return "null";
		return this.current_command.split(";")[1];
	}
}
