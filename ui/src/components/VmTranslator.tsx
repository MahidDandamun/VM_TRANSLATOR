import React, { useState } from "react";
import { translateVm } from "../lib/translators/vmAdapter";
import { Parser } from "../../../vm/parser.js";
import { vmSamples } from "../lib/samples";
import { useEffect } from "react";

export default function VmTranslator() {
	const [files, setFiles] = useState<File[] | null>(null);
	const [output, setOutput] = useState("");
	const [fileName, setFileName] = useState("output.asm");
	const [folderMode, setFolderMode] = useState(true);
	const [quickInput, setQuickInput] = useState("");
	const [stepMode, setStepMode] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const [parser, setParser] = useState<Parser | null>(null);

	const samples = {
		simple: `push constant 2\npush constant 3\nadd`,
	};

	async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
		const fl = e.target.files;
		if (!fl) return;
		setFiles(Array.from(fl));
	}

	async function onTranslate() {
		let mapped: { name: string; text: string }[] = [];
		if (files && files.length > 0) {
			mapped = await Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() })));
		} else if (quickInput.trim() !== "") {
			mapped = [{ name: "sample.vm", text: quickInput }];
		} else {
			return;
		}
		const res = await translateVm(mapped, folderMode);
		setOutput(res.output);
		setFileName(res.fileName);
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

	function loadSample() {
		setQuickInput(vmSamples.simple.code);
		setFiles(null);
	}

	useEffect(() => {
		function onLoad(e: any) {
			if (e?.detail?.type !== "vm") return;
			const key = e.detail.key;
			if (vmSamples[key]) setQuickInput(vmSamples[key].code);
		}
		window.addEventListener("loadSample", onLoad);
		function onGuidedNext() {
			stepNext();
		}
		function onGuidedPrev() {
			stepPrev();
		}
		function onGuidedStart() {
			startStep();
		}
		function onGuidedStop() {
			stopStep();
		}
		window.addEventListener("guided:next", onGuidedNext);
		window.addEventListener("guided:prev", onGuidedPrev);
		window.addEventListener("guided:start", onGuidedStart);
		window.addEventListener("guided:stop", onGuidedStop);

		function onAuto(e: any) {
			if (e?.detail?.type && e.detail.type !== "vm") return;
			if (e?.detail?.key && vmSamples[e.detail.key]) {
				setQuickInput(vmSamples[e.detail.key].code);
				setTimeout(() => onTranslate(), 80);
			} else {
				setTimeout(() => onTranslate(), 40);
			}
		}

		window.addEventListener("auto:translate", onAuto);

		return () => {
			window.removeEventListener("loadSample", onLoad);
			window.removeEventListener("guided:next", onGuidedNext);
			window.removeEventListener("guided:prev", onGuidedPrev);
			window.removeEventListener("guided:start", onGuidedStart);
			window.removeEventListener("guided:stop", onGuidedStop);
			window.removeEventListener("auto:translate", onAuto);
		};
	}, []);

	function startStep() {
		const raw = quickInput;
		const cleaned = raw
			.split("\n")
			.filter((line) => !line.includes("//") && line.trim() !== "")
			.map((line) => line.trim());
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
		const t = parser.commandType();
		let info = `#${parser.index}: ${parser.currentCommand} -> ${t}`;
		if (t === "C_ARITHMETIC") info += ` | op=${parser.arg1()}`;
		if (t === "C_PUSH" || t === "C_POP") info += ` | seg=${parser.arg1()} idx=${parser.arg2()}`;
		setOutput((o) => (o ? o + "\n" + info : info));
	}

	function stepPrev() {
		if (!parser) return;
		const raw = quickInput;
		const cleaned = raw
			.split("\n")
			.filter((line) => !line.includes("//") && line.trim() !== "")
			.map((line) => line.trim());
		const p = new Parser(cleaned);
		p.resetIndex();
		const target = Math.max(0, stepIndex - 1);
		for (let i = 0; i <= target; i++) p.advance();
		setParser(p);
		setStepIndex(target);
		const t = p.commandType();
		let info = `#${p.index}: ${p.currentCommand} -> ${t}`;
		if (t === "C_ARITHMETIC") info += ` | op=${p.arg1()}`;
		if (t === "C_PUSH" || t === "C_POP") info += ` | seg=${p.arg1()} idx=${p.arg2()}`;
		setOutput(info);
	}

	return (
		<section className="p-4 bg-white rounded shadow">
			<h2 className="font-semibold">VM Translator</h2>
			<div className="mt-2">
				<label className="mr-2">
					<input type="checkbox" checked={folderMode} onChange={(e) => setFolderMode(e.target.checked)} />{" "}
					Folder mode (bootstrap)
				</label>
			</div>

			<label className="block mt-2 text-sm text-gray-600">Select .vm files or a folder</label>
			<input
				className="mt-1"
				type="file"
				multiple
				onChange={onFilesChange}
				webkitdirectory={folderMode ? "true" : (undefined as any)}
			/>

			<label className="block mt-2 text-sm text-gray-600">Or paste VM input</label>
			<textarea
				className="w-full h-28 border p-2 mt-1"
				value={quickInput}
				onChange={(e) => setQuickInput(e.target.value)}
			/>
			<div className="mt-2 flex gap-2">
				<button className="border px-2 py-1" onClick={loadSample}>
					Load sample
				</button>
			</div>

			<div className="mt-2 flex gap-2">
				<button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={onTranslate}>
					Translate
				</button>
				<button className="bg-green-600 text-white px-3 py-1 rounded" onClick={download} disabled={!output}>
					Download
				</button>
				<div className="ml-auto flex gap-2">
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
