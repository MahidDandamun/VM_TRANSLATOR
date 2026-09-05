export const asmSamples = {
	simpleAdd: {
		title: "Simple add",
		code: `// Adds 2 + 3 and stores in RAM[0]
@2
D=A
@3
D=D+A
@0
M=D`,
		description: "A tiny ASM program that loads constants and adds them, storing the result.",
	},
	labels: {
		title: "Infinite loop label",
		code: `(LOOP)
@LOOP
0;JMP`,
		description: "Defines a label and jumps back to it (an infinite loop).",
	},
};

export const vmSamples = {
	simple: {
		title: "Push/Add",
		code: `push constant 2
push constant 3
add`,
		description: "Push two constants and add them using the VM stack.",
	},
};
