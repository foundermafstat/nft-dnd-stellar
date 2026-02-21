'use client';

import { useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/components/WelcomeScreen";
import DiceOverlay, { DiceType } from "@/components/DiceOverlay";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { playerId, setPlayerId, isLoading } = useAuth();

  // Global Dice State
  const [isRolling, setIsRolling] = useState(false);
  const [diceType, setDiceType] = useState<DiceType>('d20');
  const [diceResult, setDiceResult] = useState<number | null>(null);

  // Mock function to trigger a network-based roll from the client
  const triggerRoll = (type: DiceType) => {
    if (isRolling) return;

    setDiceType(type);
    setIsRolling(true);
    setDiceResult(null);

    // Simulate Server Delay (0.5s) to compute real result
    setTimeout(() => {
      // Mock Server Math
      let max = 20;
      if (type === 'd4') max = 4;
      if (type === 'd6') max = 6;
      if (type === 'd8') max = 8;
      if (type === 'd10') max = 10;
      if (type === 'd12') max = 12;

      const serverComputedResult = Math.floor(Math.random() * max) + 1;

      // Pass result to the 3D physics engine so it knows how to land
      setDiceResult(serverComputedResult);

      // Stop rolling after physics settles (dice keeps displaying result until onReset)
      setTimeout(() => {
        setIsRolling(false);
      }, 3000);

    }, 500);
  };

  // Don't flash the welcome screen while checking localStorage
  if (isLoading) {
    return (
      <main className="flex flex-col h-screen overflow-hidden bg-[#100c08] text-stone-200 font-sans items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-[#0a0806] text-stone-200 font-sans selection:bg-amber-900/50">

      {/* The main workspace: Canvas area taking all available space minus BottomNav */}
      <div className="flex-1 relative w-full h-full bg-[#100c08]">

        {/* Render Canvas and Fixed Overlays ONLY when logged in */}
        {playerId ? (
          <>
            <div className="absolute top-8 left-8 pointer-events-none drop-shadow-lg z-10">
              <h1 className="text-4xl font-serif font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-600 to-orange-900 drop-shadow-md">
                NFT-DND
              </h1>
              <p className="text-amber-700/80 text-xs mt-1 uppercase tracking-[0.2em] font-serif font-bold">
                Realtime Hub Area
              </p>
            </div>

            <div className="absolute top-8 right-8 drop-shadow-lg z-20 flex gap-2">
              <button onClick={() => triggerRoll('d4')} className="px-3 py-1 bg-stone-900/50 hover:bg-stone-800 border border-stone-700/50 rounded text-xs font-serif text-stone-400 hover:text-amber-200 transition-colors">d4</button>
              <button onClick={() => triggerRoll('d6')} className="px-3 py-1 bg-stone-900/50 hover:bg-stone-800 border border-stone-700/50 rounded text-xs font-serif text-stone-400 hover:text-amber-200 transition-colors">d6</button>
              <button onClick={() => triggerRoll('d8')} className="px-3 py-1 bg-stone-900/50 hover:bg-stone-800 border border-stone-700/50 rounded text-xs font-serif text-stone-400 hover:text-amber-200 transition-colors">d8</button>
              <button onClick={() => triggerRoll('d10')} className="px-3 py-1 bg-stone-900/50 hover:bg-stone-800 border border-stone-700/50 rounded text-xs font-serif text-stone-400 hover:text-amber-200 transition-colors">d10</button>
              <button onClick={() => triggerRoll('d12')} className="px-3 py-1 bg-stone-900/50 hover:bg-stone-800 border border-stone-700/50 rounded text-xs font-serif text-stone-400 hover:text-amber-200 transition-colors">d12</button>
              <button onClick={() => triggerRoll('d20')} className="px-4 py-1 bg-amber-900/50 hover:bg-amber-800 border border-amber-700/50 rounded text-xs font-bold font-serif text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.15)] hover:shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all">Roll d20</button>
            </div>

            <GameCanvas playerId={playerId} />
            <DiceOverlay
              rolling={isRolling}
              diceType={diceType}
              result={diceResult}
              onReset={() => {
                setIsRolling(false);
                setDiceResult(null);
              }}
            />
          </>
        ) : (
          <WelcomeScreen onAuth={setPlayerId} />
        )}
      </div>

      {/* The main interactive UI Layer taking its own space at the bottom */}
      <BottomNav />

    </main>
  );
}
