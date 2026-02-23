import { useState, useRef, useEffect } from 'react';
import { useGameState, ChatMessage } from '@/store/useGameState';
import { useDroppable } from '@dnd-kit/core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Backpack, Users, Send } from 'lucide-react';
import DraggableItem from './DraggableItem';
import { DiceType } from '@/components/DiceOverlay';

interface InteractionPanelProps {
    triggerRoll: (type: DiceType) => void;
}

export default function InteractionPanel({ triggerRoll }: InteractionPanelProps) {
    const { chatMessages, addMessage, currentTurn, setTurn } = useGameState();
    const [inputText, setInputText] = useState('');
    const [activeMenu, setActiveMenu] = useState<'inventory' | 'party' | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Chat is a dropzone for using items from inventory
    const { setNodeRef: setChatDropRef, isOver: isChatOver } = useDroppable({
        id: 'chat-dropzone',
        data: { type: 'chat' }
    });

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        addMessage({
            sender: 'Player',
            senderType: 'player',
            content: inputText,
        });
        setInputText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#100c08] border-l border-border relative">

            {/* 1. Chat History (Scrollable, takes up remaining space) */}
            <div
                ref={setChatDropRef}
                className={`flex-1 overflow-hidden flex flex-col relative transition-colors ${isChatOver ? 'bg-amber-900/10 ring-2 ring-inset ring-amber-500/50' : ''}`}
            >
                <div className="p-3 text-xs uppercase tracking-[0.2em] font-serif text-stone-500 font-bold border-b border-white/5 bg-black/20 shrink-0">
                    Adventure Log
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4 pb-4">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.senderType === 'player' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-stone-500 tracking-widest uppercase mb-1">{msg.sender}</span>
                                <div className={`
                  px-3 py-2 rounded-lg text-sm max-w-[85%] break-words
                  ${msg.senderType === 'player' ? 'bg-stone-800 text-stone-200 border border-stone-700 rounded-br-none' :
                                        msg.senderType === 'dm' ? 'bg-amber-900/40 text-amber-200 border border-amber-900/50 rounded-bl-none font-serif' :
                                            msg.senderType === 'system' ? 'bg-black/40 text-stone-400 border border-white/5 italic flex gap-2 items-center' :
                                                'bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-bl-none'}
                `}>
                                    {msg.content}

                                    {/* Render Spawned Item in Chat (Draggable) */}
                                    {msg.itemId && (
                                        <div className="mt-2">
                                            <DraggableItem id={msg.itemId} source="chat" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* 2. Dynamic Menus (Slide up from bottom) */}
            {activeMenu && (
                <div className="absolute bottom-[140px] inset-x-0 h-[40vh] bg-[#14100c] border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 animate-in slide-in-from-bottom-5">
                    <div className="p-4 flex justify-between items-center border-b border-white/5">
                        <h3 className="font-serif font-bold text-amber-200 tracking-wide uppercase">{activeMenu}</h3>
                        <button onClick={() => setActiveMenu(null)} className="text-stone-500 hover:text-stone-300 text-xs uppercase tracking-widest">Close [X]</button>
                    </div>

                    <ScrollArea className="h-[calc(100%-53px)]">
                        {activeMenu === 'inventory' && <InventoryMenu />}
                        {activeMenu === 'party' && <PartyMenu />}
                    </ScrollArea>
                </div>
            )}

            {/* 3. Control Panel (Fixed Bottom) */}
            <div className="shrink-0 bg-[#0a0806] border-t border-border p-3 space-y-3 z-30">

                {/* Dice & Quick Actions */}
                <div className="flex gap-2 items-center justify-between">
                    <div className="flex gap-1.5">
                        {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map(d => (
                            <button
                                key={d}
                                onClick={() => triggerRoll(d as DiceType)}
                                className={`px-2 py-1 text-xs font-serif rounded border transition-colors
                  ${d === 'd20'
                                        ? 'bg-amber-900/30 border-amber-700/50 text-amber-400 hover:bg-amber-800/50'
                                        : 'bg-stone-900 border-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={`h-7 px-2 border-stone-800/50 text-stone-400 bg-stone-900 hover:bg-stone-800 hover:text-amber-200 ${activeMenu === 'party' ? 'bg-stone-800 text-amber-200 border-amber-900/50' : ''}`}
                            onClick={() => setActiveMenu(activeMenu === 'party' ? null : 'party')}
                        >
                            <Users className="h-4 w-4" />
                        </Button>

                        {/* INVENTORY BUTTON DROPZONE */}
                        <InventoryButtonDropzone activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
                    </div>
                </div>

                {/* Text Input */}
                <div className="flex gap-2 items-center">
                    <Input
                        className="h-10 bg-stone-900 border-stone-800 text-stone-200 placeholder:text-stone-600 focus-visible:ring-amber-900/50 font-sans"
                        placeholder={currentTurn === 'player' ? "What do you do?" : "Wait for your turn..."}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={currentTurn !== 'player'}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!inputText.trim() || currentTurn !== 'player'}
                        className="h-10 px-4 bg-amber-900/50 text-amber-200 hover:bg-amber-800 hover:text-amber-100 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Separate component for Inventory Button to make it a dropzone
function InventoryButtonDropzone({ activeMenu, setActiveMenu }: { activeMenu: string | null, setActiveMenu: (m: 'inventory' | 'party' | null) => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'inventory-btn-dropzone',
        data: { type: 'inventory' }
    });

    // If item is hovered over button, open menu automatically
    useEffect(() => {
        if (isOver && activeMenu !== 'inventory') {
            setActiveMenu('inventory');
        }
    }, [isOver, activeMenu, setActiveMenu]);

    return (
        <Button
            ref={setNodeRef}
            variant="outline"
            size="sm"
            className={`h-7 px-2 transition-all duration-300
        ${activeMenu === 'inventory' ? 'bg-amber-900/30 text-amber-200 border-amber-700/50' : 'bg-stone-900 border-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-amber-200'}
        ${isOver ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : ''}
      `}
            onClick={() => setActiveMenu(activeMenu === 'inventory' ? null : 'inventory')}
        >
            <Backpack className="h-4 w-4" />
            <span className="ml-1 text-xs">{activeMenu === 'inventory' ? 'Open' : ''}</span>
        </Button>
    );
}

// Sub-components for menus
function InventoryMenu() {
    const { inventory } = useGameState();

    const { setNodeRef, isOver } = useDroppable({
        id: 'inventory-menu-dropzone',
        data: { type: 'inventory' }
    });

    return (
        <div
            ref={setNodeRef}
            className={`p-4 min-h-full transition-colors ${isOver ? 'bg-amber-900/10' : ''}`}
        >
            {inventory.length === 0 ? (
                <div className="text-center text-stone-500 font-serif italic py-8 border-2 border-dashed border-stone-800 rounded-lg">
                    Your pack is empty.<br />Drag loot here to collect it.
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-3">
                    {inventory.map(item => (
                        <div key={item.id} className="aspect-square bg-stone-900 border border-stone-800 rounded-lg flex flex-col items-center justify-center p-2 relative group hover:border-amber-700/50 transition-colors">
                            <DraggableItem id={item.id} source="inventory">
                                <div className="w-10 h-10 rounded bg-stone-950 flex items-center justify-center mb-1 text-amber-500 shadow-inner">
                                    {/* Icon placeholder based on type */}
                                    {item.type === 'weapon' ? '⚔️' : item.type === 'consumable' ? '🧪' : '🛡️'}
                                </div>
                                <span className="text-[10px] text-stone-400 text-center leading-tight truncate w-full group-hover:text-amber-200">{item.name}</span>
                            </DraggableItem>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PartyMenu() {
    const { entities } = useGameState();
    const party = entities.filter(e => e.type !== 'enemy' && e.type !== 'system');

    return (
        <div className="p-4 space-y-3">
            {party.length === 0 ? (
                <div className="text-stone-500 text-center text-sm italic">No party members found.</div>
            ) : (
                party.map(member => (
                    <div key={member.id} className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-stone-200">{member.name}</span>
                            <span className={`text-xs ${member.isDead ? 'text-red-500' : 'text-emerald-400'}`}>
                                {member.hp} / {member.maxHp} HP
                            </span>
                        </div>
                        <div className="w-full bg-black rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${member.isDead ? 'bg-red-900' : member.hp / member.maxHp > 0.3 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.max(0, Math.min(100, (member.hp / member.maxHp) * 100))}%` }}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
