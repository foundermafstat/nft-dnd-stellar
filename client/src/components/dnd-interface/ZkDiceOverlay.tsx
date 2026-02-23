import { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Hexagon, ShieldAlert } from 'lucide-react';

interface ZkDiceOverlayProps {
    rolling: boolean;
    diceType: string;
    result: number | null;
    onReset: () => void;
}

export default function ZkDiceOverlay({ rolling, diceType, result, onReset }: ZkDiceOverlayProps) {
    const [step, setStep] = useState(0);

    // Simulated ZK Proof stages
    useEffect(() => {
        if (!rolling) {
            setStep(0);
            return;
        }

        const stages = [
            setTimeout(() => setStep(1), 500),   // Initiating RISC Zero VM
            setTimeout(() => setStep(2), 1500),  // Generating Proof
            setTimeout(() => setStep(3), 2500),  // Verifying Receipt
            setTimeout(() => setStep(4), 3000),  // Done (Show result natively managed by parent)
        ];

        return () => stages.forEach(clearTimeout);
    }, [rolling]);

    if (!rolling && result === null) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-amber-900/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] relative">

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                {/* Header */}
                <div className="px-6 py-4 border-b border-amber-900/30 flex items-center justify-between bg-gradient-to-r from-amber-900/10 to-transparent">
                    <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 text-emerald-500 ${step > 0 && step < 4 ? 'animate-pulse' : ''}`} />
                        <h4 className="font-cinzel font-bold text-xs uppercase tracking-[0.2em] text-amber-200">ZK Context Execution</h4>
                    </div>
                    {step === 4 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>

                <div className="p-8 flex flex-col items-center">

                    {/* The 3D Dice / Loader Area */}
                    <div className="w-24 h-24 relative mb-8 flex items-center justify-center">
                        {step < 4 ? (
                            <div className="absolute inset-0 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                        ) : (
                            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping blur-md"></div>
                        )}
                        <div className="text-3xl font-cinzel font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10">
                            {step < 4 ? diceType : result}
                        </div>
                    </div>

                    {/* RISC Zero Step Logs */}
                    <div className="w-full space-y-3 font-mono text-[10px] uppercase tracking-wider">

                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                            <Hexagon className={`w-3 h-3 ${step === 1 ? 'animate-spin text-amber-500' : step > 1 ? 'text-emerald-500' : 'text-stone-600'}`} />
                            <span className={step >= 1 ? 'text-stone-300' : 'text-stone-600'}>
                                Loading RISC Zero Environment
                            </span>
                        </div>

                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                            <Hexagon className={`w-3 h-3 ${step === 2 ? 'animate-spin text-amber-500' : step > 2 ? 'text-emerald-500' : 'text-stone-600'}`} />
                            <span className={step >= 2 ? 'text-stone-300' : 'text-stone-600'}>
                                Executing off-chain RNG computation
                            </span>
                        </div>

                        <div className={`flex items-center gap-3 transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                            <Hexagon className={`w-3 h-3 ${step === 3 ? 'animate-spin text-amber-500' : step > 3 ? 'text-emerald-500' : 'text-stone-600'}`} />
                            <span className={step >= 3 ? 'text-stone-300' : 'text-stone-600'}>
                                Verifying ZK Receipt payload
                            </span>
                        </div>

                    </div>

                    {/* Result Footer */}
                    {step === 4 && (
                        <div className="mt-8 w-full animate-in slide-in-from-bottom-2 fade-in">
                            <div className="bg-[#111] border border-emerald-900/50 rounded-lg p-3 text-center mb-4 text-xs font-inter text-emerald-400/80">
                                0x{Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}
                            </div>
                            <button
                                onClick={onReset}
                                className="w-full py-3 bg-gradient-to-r from-amber-800 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-50 rounded-xl font-cinzel font-bold text-xs tracking-widest uppercase transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
