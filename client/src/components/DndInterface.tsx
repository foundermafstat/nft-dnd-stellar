import { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import GameCanvas from '@/components/GameCanvas';
import DiceOverlay, { DiceType } from '@/components/DiceOverlay';
import Header from './dnd-interface/Header';
import InteractionPanel from './dnd-interface/InteractionPanel';
import DraggableItem from './dnd-interface/DraggableItem';
import { useGameState } from '@/store/useGameState';

interface DndInterfaceProps {
    playerId: string;
}

export default function DndInterface({ playerId }: DndInterfaceProps) {
    const { inventory, addToInventory, removeFromInventory, addMessage } = useGameState();
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragSource, setActiveDragSource] = useState<'chat' | 'inventory' | null>(null);

    // Global Dice State within Workspace
    const [isRolling, setIsRolling] = useState(false);
    const [diceType, setDiceType] = useState<DiceType>('d20');
    const [diceResult, setDiceResult] = useState<number | null>(null);

    const triggerRoll = (type: DiceType) => {
        if (isRolling) return;
        setDiceType(type);
        setIsRolling(true);
        setDiceResult(null);

        setTimeout(() => {
            let max = parseInt(type.substring(1));
            const result = Math.floor(Math.random() * max) + 1;
            setDiceResult(result);

            addMessage({
                sender: 'System',
                senderType: 'system',
                content: `Rolled ${type}: **${result}**`,
            });

            setTimeout(() => setIsRolling(false), 3000);
        }, 500);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        setActiveDragSource(active.data.current?.source as 'chat' | 'inventory');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        setActiveDragSource(null);

        const { active, over } = event;
        if (!over) return;

        const source = active.data.current?.source;
        const dropzoneType = over.data.current?.type;
        const itemId = active.id as string;

        // RULE 1: Chat -> Inventory (Loot Pickup)
        if (source === 'chat' && (dropzoneType === 'inventory' || over.id === 'inventory-btn-dropzone' || over.id === 'inventory-menu-dropzone')) {
            const newItem = {
                id: crypto.randomUUID(),
                name: 'Mysterious Loot',
                description: 'You picked this up from the adventure.',
                type: 'misc' as const,
            };

            addToInventory(newItem);
            addMessage({
                sender: 'System',
                senderType: 'system',
                content: `You picked up ${newItem.name}.`,
            });
        }

        // RULE 2: Inventory -> Chat (Item Usage)
        if (source === 'inventory' && dropzoneType === 'chat') {
            const item = inventory.find(i => i.id === itemId);
            if (item) {
                removeFromInventory(itemId);
                addMessage({
                    sender: 'Player',
                    senderType: 'player',
                    content: `*Uses ${item.name}*`,
                });
            }
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
            <div className="flex flex-col h-screen w-full bg-[#0a0806] text-stone-200 overflow-hidden font-sans">
                {/* Global Header */}
                <Header />

                {/* Resizable Workspaces */}
                <ResizablePanelGroup direction="horizontal" className="flex-1 w-full h-full">

                    {/* Left Panel: Game Canvas Area */}
                    <ResizablePanel defaultSize={60} minSize={30} className="relative h-full flex flex-col">

                        {/* The 3D Canvas */}
                        <div className="w-full h-full relative cursor-crosshair">
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
                        </div>
                    </ResizablePanel>

                    {/* Central Handle */}
                    <ResizableHandle withHandle className="bg-border w-1.5 hover:bg-amber-900/50 hover:w-2 transition-all" />

                    {/* Right Panel: Interaction & Chat */}
                    <ResizablePanel defaultSize={40} minSize={25} className="h-full flex flex-col">
                        <InteractionPanel triggerRoll={triggerRoll} />
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>

            {/* Visual Overlay while dragging */}
            <DragOverlay dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeDragId ? (
                    <div className="opacity-90 scale-105 pointer-events-none rotate-3">
                        <div className="inline-flex items-center gap-2 bg-amber-600 border border-amber-400 text-black px-3 py-1.5 rounded-full text-xs font-serif font-bold shadow-2xl">
                            {activeDragSource === 'chat' ? '🛍️ Grabbing Loot...' : '⚔️ Using Item...'}
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

        </DndContext>
    );
}
