'use client';

import { useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [playerId, setPlayerId] = useState<string | null>(null);

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-black text-white font-sans selection:bg-purple-900">

      {/* The main workspace: Canvas area taking all available space minus BottomNav */}
      <div className="flex-1 relative w-full h-full bg-slate-950">
        {/* Title / Header overlay */}
        <div className="absolute top-8 left-8 pointer-events-none drop-shadow-lg z-10">
          <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-200">
            NFT-DND
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono">
            {playerId ? 'Realtime Hub Area' : 'Awaiting Connection...'}
          </p>
        </div>

        {playerId && (
          <div className="absolute top-8 right-8 pointer-events-none drop-shadow-lg z-10 text-right">
            <p className="text-xs text-gray-500 font-mono">Move mouse to broadcast position</p>
          </div>
        )}

        {/* The background Multi-player Canvas */}
        {playerId ? (
          <GameCanvas playerId={playerId} />
        ) : (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent flex items-center justify-center rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-mono animate-pulse">Waiting for Wallet Connection...</p>
          </div>
        )}
      </div>

      {/* The main interactive UI Layer taking its own space at the bottom */}
      <BottomNav playerId={playerId} onAuth={setPlayerId} />

    </main>
  );
}
