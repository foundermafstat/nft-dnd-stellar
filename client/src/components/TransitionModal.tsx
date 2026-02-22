'use client';

interface TransitionModalProps {
    targetName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function TransitionModal({ targetName, onConfirm, onCancel }: TransitionModalProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative max-w-sm w-full mx-4">
                {/* Glow */}
                <div className="absolute -inset-1 bg-gradient-to-b from-amber-600/20 to-transparent rounded-xl blur-lg" />

                <div className="relative bg-[#0e0c09] border border-amber-900/30 rounded-xl p-6 shadow-2xl">
                    {/* Top accent line */}
                    <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-amber-900/20 border border-amber-700/30 flex items-center justify-center">
                            <span className="text-2xl">🚪</span>
                        </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-center text-amber-200 font-serif font-bold text-lg mb-1">
                        Zone Transition
                    </h3>
                    <p className="text-center text-stone-400 font-serif text-sm mb-6">
                        Do you wish to travel to <span className="text-amber-400 font-semibold">{targetName}</span>?
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700/50 bg-stone-900/50 text-stone-400 font-serif text-sm
                                       hover:bg-stone-800/50 hover:text-stone-300 hover:border-stone-600/50 transition-all duration-200 cursor-pointer"
                        >
                            Stay
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-amber-700/50 bg-gradient-to-b from-amber-800/30 to-amber-900/20 text-amber-200 font-serif text-sm font-semibold
                                       hover:from-amber-700/40 hover:to-amber-800/30 hover:border-amber-600/50 hover:shadow-[0_0_20px_rgba(217,119,6,0.15)] transition-all duration-200 cursor-pointer"
                        >
                            Travel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
