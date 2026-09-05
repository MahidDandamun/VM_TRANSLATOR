import React, { useState } from "react";
import { translateAsm } from "../lib/translators/asmAdapter";
import { Parser } from "../../../asm/SL_ASSEMBLER/parser.js";
import { asmSamples } from "../lib/samples";
import { useEffect } from "react";

export default function AsmTranslator() {
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [fileName, setFileName] = useState("project6.hack");
	const [stepMode, setStepMode] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const [parser, setParser] = useState<Parser | null>(null);

	const samples = {
		simpleAdd: `// Simple add\n@2\nD=A\n@3\nD=D+A\n@0\nM=D`,
		labels: `(LOOP)\n@LOOP\n0;JMP`,
	};

	function onTranslate() {
		const res = translateAsm(input, fileName);
		setOutput(res.output);
	}

	function loadSample(key: keyof typeof samples) {
		setInput(samples[key]);
		setOutput("");
	}

	useEffect(() => {
		function onLoad(e: any) {
			if (e?.detail?.type !== "asm") return;
			const key = e.detail.key;
			if (asmSamples[key]) setInput(asmSamples[key].code);
		}

		window.addEventListener("loadSample", onLoad);

		function onAuto(e: any) {
			if (e?.detail?.type && e.detail.type !== "asm") return;
			// when auto translate is requested, ensure input is set (loadSample may have run just before)
			if (e?.detail?.key && asmSamples[e.detail.key]) {
				setInput(asmSamples[e.detail.key].code);
				setTimeout(() => onTranslate(), 80);
			} else {
				setTimeout(() => onTranslate(), 40);
			}
		}

		window.addEventListener("auto:translate", onAuto);

		function onGuidedStart() {
			startStep();
		}
		function onGuidedNext() {
			stepNext();
		}
		function onGuidedPrev() {
			stepPrev();
		}
		function onGuidedStop() {
			stopStep();
		}

		window.addEventListener("guided:start", onGuidedStart);
		window.addEventListener("guided:next", onGuidedNext);
		window.addEventListener("guided:prev", onGuidedPrev);
		window.addEventListener("guided:stop", onGuidedStop);

		return () => {
			window.removeEventListener("loadSample", onLoad);
			window.removeEventListener("auto:translate", onAuto);
			window.removeEventListener("guided:start", onGuidedStart);
			window.removeEventListener("guided:next", onGuidedNext);
			window.removeEventListener("guided:prev", onGuidedPrev);
			window.removeEventListener("guided:stop", onGuidedStop);
		};
	}, []);

	function startStep() {
		const cleaned = input
			.split("\n")
			.filter((str) => !str.includes("//") && str.trim() !== "")
			.map((s) => s.trim());
		const p = new Parser(cleaned);
		p.resetIndex();
		setParser(p);
		setStepIndex(-1);
		setStepMode(true);
		setOutput("");
	}

	function stopStep() {
		setParser(null);
		setStepMode(false);
		setStepIndex(0);
	}

	function stepNext() {
		if (!parser) return;
		if (!parser.hasMoreCommands()) return;
		parser.advance();
		setStepIndex((i) => i + 1);
		// show current command info in output area for debugging
		const t = parser.commandType();
		let info = `#${parser.index}: ${parser.current_command} -> ${t}`;
		if (t === "A_COMMAND" || t === "L_COMMAND") info += ` | symbol=${parser.symbol()}`;
		if (t === "C_COMMAND") info += ` | dest=${parser.dest()} comp=${parser.comp()} jump=${parser.jump()}`;
		setOutput((o) => (o ? o + "\n" + info : info));
	}

	function stepPrev() {
		// Simple prev support by re-creating parser and advancing to index-1
		if (!parser) return;
		const cleaned = input
			.split("\n")
			.filter((str) => !str.includes("//") && str.trim() !== "")
			.map((s) => s.trim());
		const p = new Parser(cleaned);
		p.resetIndex();
		const target = Math.max(0, stepIndex - 1);
		for (let i = 0; i <= target; i++) p.advance();
		setParser(p);
		setStepIndex(target);
		const t = p.commandType();
		let info = `#${p.index}: ${p.current_command} -> ${t}`;
		if (t === "A_COMMAND" || t === "L_COMMAND") info += ` | symbol=${p.symbol()}`;
		if (t === "C_COMMAND") info += ` | dest=${p.dest()} comp=${p.comp()} jump=${p.jump()}`;
		setOutput(info);
	}

	function download() {
		const blob = new Blob([output], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<section className="p-4 bg-white rounded shadow">
			<h2 className="font-semibold">ASM Translator</h2>
			<label className="block mt-2 text-sm text-gray-600">Output filename</label>
			<input className="border p-1 mt-1" value={fileName} onChange={(e) => setFileName(e.target.value)} />

			<label className="block mt-2 text-sm text-gray-600">ASM input</label>
			<textarea
				className="w-full h-40 border p-2 mt-1"
				value={input}
				onChange={(e) => setInput(e.target.value)}
			/>

			<div className="mt-2 flex gap-2">
				<button
					aria-label="Translate ASM"
					className="bg-sky-700 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 text-white px-3 py-1 rounded"
					onClick={onTranslate}
				>
					Translate
				</button>
				<button
					aria-label="Download ASM output"
					className="bg-emerald-700 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white px-3 py-1 rounded"
					onClick={download}
					disabled={!output}
				>
					Download
				</button>
				<div className="ml-auto flex gap-2">
					<button className="border px-2 py-1" onClick={() => loadSample("simpleAdd")}>
						Load sample
					</button>
					<button className="border px-2 py-1" onClick={startStep} disabled={stepMode}>
						Start Step
					</button>
					<button className="border px-2 py-1" onClick={stopStep} disabled={!stepMode}>
						Stop
					</button>
					<button className="border px-2 py-1" onClick={stepPrev} disabled={!stepMode}>
						Prev
					</button>
					<button className="border px-2 py-1" onClick={stepNext} disabled={!stepMode}>
						Next
					</button>
				</div>
			</div>

			<label className="block mt-2 text-sm text-gray-600">Output preview</label>
			<textarea className="w-full h-40 border p-2 mt-1" value={output} readOnly />
		</section>
	);
}
