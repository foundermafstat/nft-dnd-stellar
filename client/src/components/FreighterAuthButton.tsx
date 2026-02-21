'use client';

import { useState } from 'react';
import { isAllowed, setAllowed, requestAccess } from '@stellar/freighter-api';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthButtonProps {
    onAuthenticated: (playerId: string) => void;
}

export default function FreighterAuthButton({ onAuthenticated }: AuthButtonProps) {
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

            const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

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

    return (
        <div className="flex items-center gap-4">
            {error && <span className="text-red-400 text-xs font-mono max-w-xs">{error}</span>}
            <Button
                onClick={handleConnect}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all flex items-center gap-2"
            >
                <LogIn className="w-4 h-4" />
                {loading ? 'CONNECTING...' : 'CONNECT FREIGHTER'}
            </Button>
        </div>
    );
}
