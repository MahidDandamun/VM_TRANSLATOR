import React from "react";
import AsmTranslator from "./components/AsmTranslator";
import VmTranslator from "./components/VmTranslator";
import Tutorial from "./components/Tutorial";

export default function App() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
			<div className="max-w-6xl mx-auto">
				<header className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<svg
							width="36"
							height="36"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden
						>
							<rect x="2" y="3" width="20" height="18" rx="2" fill="#0ea5e9" />
							<path
								d="M7 8h10M7 12h10M7 16h6"
								stroke="white"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						<div>
							<div className="text-xl font-bold">VM & ASM Translator</div>
							<div className="text-sm text-gray-600">
								Interactive lessons to learn compilers and assembly
							</div>
						</div>
					</div>
				</header>

				<div className="grid grid-cols-3 gap-6">
					<div className="col-span-2">
						<div className="grid grid-cols-1 gap-6">
							<AsmTranslator />
							<VmTranslator />
						</div>
					</div>
					<div className="col-span-1">
						<Tutorial />
					</div>
				</div>
			</div>
		</div>
	);
}
