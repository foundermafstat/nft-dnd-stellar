'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
    playerId: string | null;
    setPlayerId: (id: string | null) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    playerId: null,
    setPlayerId: () => { },
    logout: () => { },
    isLoading: true,
});

const STORAGE_KEY = 'nft-dnd-player-id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [playerId, setPlayerIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: restore from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setPlayerIdState(stored);
            }
        } catch {
            // localStorage unavailable (SSR, etc.)
        }
        setIsLoading(false);
    }, []);

    // Persist to localStorage when playerId changes
    const setPlayerId = useCallback((id: string | null) => {
        setPlayerIdState(id);
        try {
            if (id) {
                localStorage.setItem(STORAGE_KEY, id);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // localStorage unavailable
        }
    }, []);

    // Explicit logout: clear storage + state
    const logout = useCallback(() => {
        setPlayerIdState(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch { }
    }, []);

    return (
        <AuthContext.Provider value={{ playerId, setPlayerId, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
