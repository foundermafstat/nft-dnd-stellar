'use client';

import { Backpack, Map, Scroll, Settings, Swords, LogOut, Wallet, ChevronUp } from "lucide-react";
import { useState } from "react";
import FreighterAuthButton from "./FreighterAuthButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BottomNavProps {
    playerId: string | null;
    onAuth: (id: string | null) => void;
}

export default function BottomNav({ playerId, onAuth }: BottomNavProps) {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const toggleTab = (tab: string) => {
        if (!playerId) return; // Disallow opening menus if not connected
        setActiveTab(activeTab === tab ? null : tab);
    };

    const handleLogout = () => {
        onAuth(null);
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
                className={`absolute bottom-full left-0 right-0 bg-slate-950/95 border-t border-purple-500/30 backdrop-blur-md transition-all duration-300 ease-in-out text-white shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${activeTab ? 'h-[60vh] opacity-100 p-6' : 'h-0 opacity-0 overflow-hidden pt-0 pb-0'
                    }`}
            >
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    {activeTab === 'inventory' && <h2 className="text-2xl font-bold font-serif text-amber-500 mb-4">Inventory</h2>}
                    {activeTab === 'combat' && <h2 className="text-2xl font-bold font-serif text-red-500 mb-4">Combat Log</h2>}
                    {activeTab === 'map' && <h2 className="text-2xl font-bold font-serif text-blue-500 mb-4">World Map</h2>}
                    {activeTab === 'lore' && <h2 className="text-2xl font-bold font-serif text-emerald-500 mb-4">Lore Journal</h2>}
                    {activeTab === 'settings' && <h2 className="text-2xl font-bold font-serif text-gray-300 mb-4">Game Settings</h2>}

                    <p className="text-slate-400">Content for {activeTab} goes here. This overlay covers the real-time canvas beneath it without stopping the background loop.</p>
                </div>
            </div>

            {/* The Bottom Navigation Bar (Fixed bottom, full width) */}
            <div className="w-full bg-slate-950 border-t border-slate-800 h-20 flex items-center px-6 shadow-2xl relative">

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
                                className={`flex flex-col items-center gap-1 transition-all duration-200 mt-2 h-full justify-center ${isDisabled ? 'text-slate-700 cursor-not-allowed hidden' :
                                        isActive
                                            ? 'text-purple-400 -translate-y-1'
                                            : 'text-slate-400 hover:text-white hover:-translate-y-1'
                                    }`}
                            >
                                <Tab.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : ''}`} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">{Tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Right side: Wallet connect or User Menu */}
                <div className="ml-auto w-1/3 flex justify-end items-center h-full z-10">
                    {!playerId ? (
                        <FreighterAuthButton onAuthenticated={onAuth} />
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg px-4 py-2 font-mono text-sm transition-colors text-white outline-none">
                                <Wallet className="w-4 h-4 text-purple-400" />
                                <span className="max-w-[100px] truncate">{playerId}</span>
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={12} className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    Copy Wallet Address
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="focus:bg-red-950 focus:text-red-400 text-red-500 cursor-pointer"
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
