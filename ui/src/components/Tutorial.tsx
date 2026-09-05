import React, { useState } from "react";
import { asmSamples, vmSamples } from "../lib/samples";

export default function Tutorial() {
	function loadSample(type: "asm" | "vm", key: string) {
		window.dispatchEvent(new CustomEvent("loadSample", { detail: { type, key } }));
	}

	// Guided lesson state
	const [guidedStep, setGuidedStep] = useState(0);
	const lessonLines = asmSamples.simpleAdd.code.split("\n");
	const explanations = lessonLines.map((ln) => {
		if (ln.startsWith("@")) return `Sets A register to ${ln.slice(1)}`;
		if (ln.includes("D=A")) return "Copies A into D (D = A)";
		if (ln.includes("D=D+A")) return "Adds D and A, result in D";
		if (ln.includes("M=D")) return "Stores D into the memory address currently in A";
		return "Assembly instruction";
	});

	function startGuided() {
		// load sample into ASM editor and start stepping
		loadSample("asm", "simpleAdd");
		setGuidedStep(0);
		// signal translators to start guided mode
		window.dispatchEvent(new CustomEvent("guided:start", {}));
	}

	function nextGuided() {
		window.dispatchEvent(new CustomEvent("guided:next", {}));
		setGuidedStep((s) => Math.min(s + 1, explanations.length - 1));
	}

	function prevGuided() {
		window.dispatchEvent(new CustomEvent("guided:prev", {}));
		setGuidedStep((s) => Math.max(s - 1, 0));
	}

	function stopGuided() {
		window.dispatchEvent(new CustomEvent("guided:stop", {}));
		setGuidedStep(0);
	}

	return (
		<aside className="p-4 bg-white rounded shadow h-full" aria-labelledby="tutorial-heading">
			<h2 id="tutorial-heading" className="text-lg font-semibold">
				Beginner Guide
			</h2>
			<p className="mt-2 text-sm text-gray-700">
				This interactive UI helps you learn how simple programs are translated from VM/ASM to Hack assembly and
				machine code. Use the editors to paste or load sample programs, then press <strong>Translate</strong> to
				see the result.
			</p>

			<section className="mt-4">
				<h3 className="font-medium">Key Concepts</h3>
				<ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
					<li>
						<strong>ASM:</strong> low-level assembly language that maps almost directly to machine code.
					</li>
					<li>
						<strong>VM:</strong> a higher-level stack-based language that the translator converts to ASM.
					</li>
					<li>
						<strong>Translator:</strong> converts VM/ASM into Hack assembly or machine code you can run on
						the simulator.
					</li>
				</ul>
			</section>

			<section className="mt-4">
				<h3 className="font-medium">Try a sample</h3>
				<div className="mt-2">
					<div className="text-sm text-gray-700">ASM samples</div>
					{Object.entries(asmSamples).map(([k, s]) => (
						<div key={k} className="mt-2">
							<div className="font-semibold">{s.title}</div>
							<div className="text-xs text-gray-600">{s.description}</div>
							<div className="mt-1 flex gap-2">
								<button className="px-2 py-1 border text-sm" onClick={() => loadSample("asm", k)}>
									Load into ASM editor
								</button>
								<button
									className="px-2 py-1 bg-amber-500 text-white rounded text-sm"
									onClick={() => {
										loadSample("asm", k);
										setTimeout(
											() =>
												window.dispatchEvent(
													new CustomEvent("auto:translate", {
														detail: { type: "asm", key: k },
													}),
												),
											80,
										);
									}}
								>
									Generate
								</button>
								<button
									className="px-2 py-1 border text-sm"
									onClick={() => navigator.clipboard.writeText(s.code)}
								>
									Copy
								</button>
							</div>
						</div>
					))}
				</div>

				<div className="mt-3">
					<div className="text-sm text-gray-700">VM samples</div>
					{Object.entries(vmSamples).map(([k, s]) => (
						<div key={k} className="mt-2">
							<div className="font-semibold">{s.title}</div>
							<div className="text-xs text-gray-600">{s.description}</div>
							<div className="mt-1 flex gap-2">
								<button className="px-2 py-1 border text-sm" onClick={() => loadSample("vm", k)}>
									Load into VM editor
								</button>
								<button
									className="px-2 py-1 bg-amber-500 text-white rounded text-sm"
									onClick={() => {
										loadSample("vm", k);
										setTimeout(
											() =>
												window.dispatchEvent(
													new CustomEvent("auto:translate", {
														detail: { type: "vm", key: k },
													}),
												),
											80,
										);
									}}
								>
									Generate
								</button>
								<button
									className="px-2 py-1 border text-sm"
									onClick={() => navigator.clipboard.writeText(s.code)}
								>
									Copy
								</button>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="mt-4">
				<h3 className="font-medium">Guided Lesson: Simple add</h3>
				<p className="text-sm text-gray-700 mt-2">
					Follow the small program step-by-step to see what each instruction does.
				</p>
				<div className="mt-2 text-sm">
					<div className="bg-gray-50 p-2 rounded">
						<div className="font-medium">
							Step {guidedStep + 1} / {explanations.length}
						</div>
						<div className="text-xs text-gray-600 mt-1">{lessonLines[guidedStep]}</div>
						<div className="mt-1">{explanations[guidedStep]}</div>
						<div className="mt-2 flex gap-2">
							<button className="px-2 py-1 bg-indigo-600 text-white rounded" onClick={startGuided}>
								Start Guided
							</button>
							<button className="px-2 py-1 border" onClick={prevGuided}>
								Prev
							</button>
							<button className="px-2 py-1 border" onClick={nextGuided}>
								Next
							</button>
							<button className="px-2 py-1 border text-red-600" onClick={stopGuided}>
								Stop
							</button>
						</div>
					</div>
				</div>
			</section>
		</aside>
	);
}
