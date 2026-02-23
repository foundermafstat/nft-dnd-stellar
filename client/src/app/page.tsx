'use client';

import { useState, useEffect } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import DndInterface from "@/components/DndInterface";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { SERVER_URL } from "@/lib/config";


export default function Home() {
  const { playerId, setPlayerId, isLoading } = useAuth();
  const router = useRouter();

  // Character Check State
  const [characters, setCharacters] = useState<any[] | null>(null);
  const [isLoadingChars, setIsLoadingChars] = useState(false);

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
            <DndInterface playerId={playerId} />
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


    </main>
  );
}
