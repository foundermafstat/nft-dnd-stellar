'use client';

import { Backpack, Map, Scroll, Settings, Swords, LogOut, Wallet, ChevronUp } from "lucide-react";
import { useState } from "react";
import FreighterAuthButton from "./FreighterAuthButton";
import { useAuth } from "@/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BottomNav() {
    const { playerId, setPlayerId, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const toggleTab = (tab: string) => {
        if (!playerId) return;
        setActiveTab(activeTab === tab ? null : tab);
    };

    const handleLogout = () => {
        logout();
        setActiveTab(null);
    };

    const tabs = [
        { id: 'combat', icon: Swords, label: 'Combat' },
        { id: 'inventory', icon: Backpack, label: 'Inv' },
        { id: 'map', icon: Map, label: 'Map' },
        { id: 'lore', icon: Scroll, label: 'Lore' },
        { id: 'settings', icon: Settings, label: 'Options' },
    ];

    return (
        <div className="relative w-full z-50">
            {/* The Overlay Content Area that slides up FROM the nav */}
            <div
                className={`absolute bottom-full left-0 right-0 bg-[#0a0806]/95 border-t border-amber-900/40 backdrop-blur-md transition-all duration-300 ease-in-out text-stone-300 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] ${activeTab ? 'h-[60vh] opacity-100 p-6' : 'h-0 opacity-0 overflow-hidden pt-0 pb-0'
                    }`}
            >
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    {activeTab === 'inventory' && <h2 className="text-2xl font-bold font-serif text-amber-500 mb-4">Inventory</h2>}
                    {activeTab === 'combat' && <h2 className="text-2xl font-bold font-serif text-amber-600 mb-4">Combat Log</h2>}
                    {activeTab === 'map' && <h2 className="text-2xl font-bold font-serif text-sky-600 mb-4">World Map</h2>}
                    {activeTab === 'lore' && <h2 className="text-2xl font-bold font-serif text-emerald-600 mb-4">Lore Journal</h2>}
                    {activeTab === 'settings' && <h2 className="text-2xl font-bold font-serif text-stone-400 mb-4">Game Settings</h2>}

                    <p className="text-stone-500 font-serif">Content for {activeTab} goes here. This overlay covers the real-time canvas beneath it without stopping the background loop.</p>
                </div>
            </div>

            {/* The Bottom Navigation Bar (Fixed bottom, full width) */}
            <div className="w-full bg-[#050403] border-t border-amber-900/30 h-20 flex items-center px-6 shadow-[0_-5px_30px_rgba(0,0,0,0.9)] relative">

                {/* Center Tabs */}
                <div className="absolute left-1/2 -translate-x-1/2 flex gap-8 items-center h-full">
                    {tabs.map((Tab) => {
                        const isActive = activeTab === Tab.id;
                        const isDisabled = !playerId;
                        return (
                            <button
                                key={Tab.id}
                                onClick={() => toggleTab(Tab.id)}
                                disabled={isDisabled}
                                className={`flex flex-col items-center gap-1 transition-all duration-200 mt-2 h-full justify-center ${isDisabled ? 'text-stone-800 cursor-not-allowed hidden' :
                                    isActive
                                        ? 'text-amber-500 -translate-y-1'
                                        : 'text-stone-500 hover:text-amber-200 hover:-translate-y-1'
                                    }`}
                            >
                                <Tab.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]' : ''}`} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">{Tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Right side: Wallet connect or User Menu */}
                <div className="ml-auto w-1/3 flex justify-end items-center h-full z-10">
                    {!playerId ? (
                        <FreighterAuthButton onAuthenticated={setPlayerId} />
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 bg-[#14100c] border border-amber-900/30 hover:bg-[#1f1912] rounded-lg px-4 py-2 font-serif text-sm transition-colors text-amber-100 outline-none">
                                <Wallet className="w-4 h-4 text-amber-600" />
                                <span className="max-w-[100px] truncate">{playerId}</span>
                                <ChevronUp className="w-4 h-4 text-stone-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={12} className="w-56 bg-[#0a0806] border-amber-900/30 text-stone-300">
                                <DropdownMenuLabel className="text-amber-500/50 font-serif tracking-widest uppercase text-xs">My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-amber-900/20" />
                                <DropdownMenuItem className="focus:bg-[#14100c] focus:text-amber-400 cursor-pointer font-sans">
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-[#14100c] focus:text-amber-400 cursor-pointer font-sans">
                                    Copy Wallet Address
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-amber-900/20" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="focus:bg-red-950/30 focus:text-red-400 text-red-500/80 cursor-pointer font-sans"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Disconnect
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

            </div>
        </div>
    );
}
