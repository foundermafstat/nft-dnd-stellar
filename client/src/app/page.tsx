'use client';

import { useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/components/WelcomeScreen";
import DiceOverlay, { DiceType } from "@/components/DiceOverlay";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserPlus } from "lucide-react";
import { SERVER_URL } from "@/lib/config";


export default function Home() {
  const { playerId, setPlayerId, isLoading } = useAuth();
  const router = useRouter();

  // Character Check State
  const [characters, setCharacters] = useState<any[] | null>(null);
  const [isLoadingChars, setIsLoadingChars] = useState(false);

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

  useEffect(() => {
    if (playerId) {
      setIsLoadingChars(true);

      fetch(`${SERVER_URL}/api/character/player/${playerId}`)
        .then(res => res.json())
        .then(data => {
          setCharacters(data.characters || []);
        })
        .catch(console.error)
        .finally(() => setIsLoadingChars(false));
    } else {
      setCharacters(null);
    }
  }, [playerId]);

  // Don't flash the welcome screen while checking localStorage or characters
  if (isLoading || isLoadingChars) {
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

        {/* Render Canvas and Fixed Overlays ONLY when logged in and has characters */}
        {playerId && characters !== null ? (
          characters.length > 0 ? (
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
            <div className="flex flex-col items-center justify-center h-full text-center relative z-20">
              <div className="bg-[#14100c] border border-amber-900/30 rounded-2xl p-10 shadow-2xl max-w-lg w-full relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
                <h2 className="text-3xl font-serif text-amber-100 mb-4">No Hero Found</h2>
                <p className="text-stone-400 font-serif leading-relaxed mb-8">
                  Your wallet is connected, but you have no heroes bound to your fate. Enter the forge and roll your attributes to begin your journey.
                </p>
                <button
                  onClick={() => router.push('/create')}
                  className="w-full relative group perspective-1000"
                >
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-amber-600 via-orange-500 to-amber-800 opacity-60 group-hover:opacity-100 transition duration-500 blur-md"></div>
                  <div className="relative bg-[#100c08] border border-amber-500/50 rounded-lg py-4 flex items-center justify-center gap-3 transition-transform duration-300 group-hover:scale-[0.98] group-active:scale-95 shadow-inner">
                    <UserPlus className="w-5 h-5 text-amber-400" />
                    <span className="font-bold font-mono tracking-widest text-amber-50 uppercase">
                      Forge a Hero
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )
        ) : (
          <WelcomeScreen onAuth={setPlayerId} />
        )}
      </div>

      {playerId && characters && characters.length > 0 && <BottomNav />}

    </main>
  );
}
