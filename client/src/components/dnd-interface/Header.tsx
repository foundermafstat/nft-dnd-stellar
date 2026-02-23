import { Wallet, LogOut, ChevronDown, Map, Scroll, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGameState } from '@/store/useGameState';

export default function Header() {
    const { playerId, logout } = useAuth();
    const { currentTurn } = useGameState();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="w-full h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm z-50 relative shrink-0">
            {/* Left: Logo & Game Info */}
            <div className="flex items-center gap-8">
                <h1 className="text-2xl font-serif font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-600 to-orange-900 drop-shadow-sm cursor-pointer">
                    NFT-DND
                </h1>

                {/* Navigation Menus (Moved from BottomNav) */}
                {playerId && (
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold tracking-widest uppercase text-muted-foreground hover:text-amber-400 transition-colors dropdown-open:text-amber-400 outline-none">
                                <Map className="w-4 h-4" /> Map <ChevronDown className="w-3 h-3 opacity-50" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
                                <DropdownMenuLabel className="font-serif text-amber-200/50">World Map</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">Global Region</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Local Dungeon</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold tracking-widest uppercase text-muted-foreground hover:text-amber-400 transition-colors dropdown-open:text-amber-400 outline-none">
                                <Scroll className="w-4 h-4" /> Lore <ChevronDown className="w-3 h-3 opacity-50" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
                                <DropdownMenuLabel className="font-serif text-amber-200/50">Chronicles</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">Quest Journal</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">NPC Entries</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold tracking-widest uppercase text-muted-foreground hover:text-amber-400 transition-colors dropdown-open:text-amber-400 outline-none">
                                <Settings className="w-4 h-4" /> Options <ChevronDown className="w-3 h-3 opacity-50" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
                                <DropdownMenuLabel className="font-serif text-amber-200/50">Game Settings</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">Audio</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Interface</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Right: Turn Indicator & User Menu */}
            <div className="flex items-center gap-6">
                {/* Turn Indicator */}
                <div className="flex items-center gap-2 bg-stone-900/50 px-3 py-1 rounded-md border border-stone-800">
                    <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">Turn:</span>
                    <span className={`text-sm font-bold capitalize ${currentTurn === 'player' ? 'text-emerald-400' :
                            currentTurn === 'enemy' ? 'text-red-400' :
                                currentTurn === 'ally' ? 'text-blue-400' : 'text-amber-400'
                        }`}>
                        {currentTurn}
                    </span>
                </div>

                {playerId ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 bg-muted border border-border hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 font-serif text-sm transition-colors text-foreground outline-none">
                            <Wallet className="w-4 h-4 text-primary" />
                            <span className="max-w-[100px] truncate">{playerId}</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground">
                            <DropdownMenuLabel className="text-muted-foreground font-serif tracking-widest uppercase text-xs">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground cursor-pointer font-sans">
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="focus:bg-destructive/20 focus:text-destructive text-destructive cursor-pointer font-sans"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Disconnect
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="text-sm text-muted-foreground">Not connected</div>
                )}
            </div>
        </div>
    );
}
