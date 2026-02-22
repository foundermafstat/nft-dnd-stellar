'use client';

import { useState } from 'react';
import { isAllowed, setAllowed, requestAccess } from '@stellar/freighter-api';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SERVER_URL } from '@/lib/config';


interface AuthButtonProps {
    onAuthenticated: (playerId: string) => void;
    variant?: 'default' | 'hero' | 'footer';
}

export default function FreighterAuthButton({ onAuthenticated, variant = 'default' }: AuthButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!(await isAllowed())) {
                await setAllowed();
            }

            const pubKey = await requestAccess();



            const response = await fetch(`${SERVER_URL}/api/auth/wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicKey: pubKey })
            });

            if (!response.ok) {
                throw new Error('Failed to save player session');
            }

            const { player } = await response.json();

            onAuthenticated(player.id);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error connecting to Wallet');
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'hero' || variant === 'footer') {
        return (
            <div className="flex flex-col items-center w-full">
                {error && <span className="text-red-400 text-sm font-medium mb-3 absolute -top-8 w-full text-center">{error}</span>}
                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="group relative w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-foreground text-background font-bold tracking-widest uppercase rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(245,158,11,0.3)]"
                >
                    {/* Animated glowing gradient background that spins */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Dark inner layer that shrinks slightly on hover for the border effect */}
                    <div className="absolute inset-[2px] bg-foreground rounded-full transition-all group-hover:bg-background/90 z-0"></div>

                    {/* Text and Icon on top */}
                    <span className="relative z-10 flex items-center gap-3 text-background group-hover:text-amber-400 transition-colors duration-300">
                        <LogIn className={`w-5 h-5 ${loading ? 'animate-pulse' : 'group-hover:translate-x-1 transition-transform duration-300'}`} />
                        {loading ? 'CONNECTING...' : 'CONNECT WALLET'}
                    </span>

                    {/* Glossy overlay reflection */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-full pointer-events-none z-10"></div>
                </button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4">
            {error && <span className="text-red-400 text-xs font-medium max-w-xs">{error}</span>}
            <Button
                onClick={handleConnect}
                disabled={loading}
                className="bg-foreground hover:bg-foreground/90 text-background font-bold uppercase tracking-wider rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
                <LogIn className="w-4 h-4" />
                {loading ? 'CONNECTING...' : 'CONNECT WALLET'}
            </Button>
        </div>
    );
}
