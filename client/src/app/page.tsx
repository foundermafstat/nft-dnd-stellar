'use client';

import { useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/components/WelcomeScreen";
import DiceOverlay, { DiceType } from "@/components/DiceOverlay";

export default function Home() {
  const [playerId, setPlayerId] = useState<string | null>(null);

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

      // After 5 seconds, clear the overlay completely
      setTimeout(() => {
        setIsRolling(false);
        setDiceResult(null);
      }, 5000);

    }, 500);
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-black text-white font-sans selection:bg-purple-900">

      {/* The main workspace: Canvas area taking all available space minus BottomNav */}
      <div className="flex-1 relative w-full h-full bg-slate-950">

        {/* Render Canvas and Fixed Overlays ONLY when logged in */}
        {playerId ? (
          <>
            <div className="absolute top-8 left-8 pointer-events-none drop-shadow-lg z-10">
              <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-200">
                NFT-DND
              </h1>
              <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono">
                Realtime Hub Area
              </p>
            </div>

            <div className="absolute top-8 right-8 drop-shadow-lg z-20 flex gap-2">
              <button onClick={() => triggerRoll('d4')} className="px-3 py-1 bg-pink-900/50 hover:bg-pink-800 border border-pink-500/30 rounded text-xs font-mono">d4</button>
              <button onClick={() => triggerRoll('d6')} className="px-3 py-1 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-500/30 rounded text-xs font-mono">d6</button>
              <button onClick={() => triggerRoll('d8')} className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800 border border-blue-500/30 rounded text-xs font-mono">d8</button>
              <button onClick={() => triggerRoll('d10')} className="px-3 py-1 bg-purple-900/50 hover:bg-purple-800 border border-purple-500/30 rounded text-xs font-mono">d10</button>
              <button onClick={() => triggerRoll('d12')} className="px-3 py-1 bg-green-900/50 hover:bg-green-800 border border-green-500/30 rounded text-xs font-mono">d12</button>
              <button onClick={() => triggerRoll('d20')} className="px-4 py-1 bg-red-900/80 hover:bg-red-700 border border-red-500/50 rounded text-xs font-bold font-mono">Roll d20</button>
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
      <BottomNav playerId={playerId} onAuth={setPlayerId} />

    </main>
  );
}
