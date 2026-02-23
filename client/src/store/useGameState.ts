import { create } from 'zustand';

export type ActorType = 'player' | 'enemy' | 'ally' | 'system' | 'dm';

export interface ChatMessage {
    id: string;
    sender: string;
    senderType: ActorType;
    content: string;
    itemId?: string; // If this message spawned an item
    timestamp: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    type: 'weapon' | 'armor' | 'consumable' | 'misc';
    icon?: string;
}

export interface Entity {
    id: string;
    name: string;
    type: ActorType;
    hp: number;
    maxHp: number;
    isDead: boolean;
    statusEffects: string[];
}

interface GameState {
    // Turn State
    currentTurn: ActorType;
    setTurn: (turn: ActorType) => void;

    // NPC Dialog State
    activeNpc: { id: string, name: string } | null;
    setActiveNpc: (npc: { id: string, name: string } | null) => void;

    // Chat Log
    chatMessages: ChatMessage[];
    addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    removeMessage: (id: string) => void;

    // Inventory
    inventory: InventoryItem[];
    addToInventory: (item: InventoryItem) => void;
    removeFromInventory: (id: string) => void;

    // Entities on Map
    entities: Entity[];
    setEntities: (entities: Entity[]) => void;
    updateEntityHp: (id: string, hpOffset: number) => void;

    // Player Data
    playerCharacter: any | null;
    setPlayerCharacter: (char: any | null) => void;
}

export const useGameState = create<GameState>((set) => ({
    currentTurn: 'player',
    setTurn: (turn) => set({ currentTurn: turn }),

    activeNpc: null,
    setActiveNpc: (npc) => set({ activeNpc: npc }),

    chatMessages: [
        {
            id: 'system-start',
            sender: 'System',
            senderType: 'system',
            content: 'Adventure begins...',
            timestamp: Date.now(),
        }
    ],
    addMessage: (msg) =>
        set((state) => ({
            chatMessages: [
                ...state.chatMessages,
                { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
            ],
        })),
    removeMessage: (id) =>
        set((state) => ({
            chatMessages: state.chatMessages.filter((m) => m.id !== id),
        })),

    inventory: [
        { id: crypto.randomUUID(), name: 'Health Potion', description: 'Restores 10 HP', type: 'consumable' },
        { id: crypto.randomUUID(), name: 'Shortsword', description: '1d6 slashing', type: 'weapon' }
    ],
    addToInventory: (item) =>
        set((state) => ({
            inventory: [...state.inventory, item],
        })),
    removeFromInventory: (id) =>
        set((state) => ({
            inventory: state.inventory.filter((i) => i.id !== id),
        })),

    entities: [],
    setEntities: (entities) => set({ entities }),
    updateEntityHp: (id, hpOffset) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id === id) {
                    const newHp = Math.max(0, Math.min(e.maxHp, e.hp + hpOffset));
                    return { ...e, hp: newHp, isDead: newHp === 0 };
                }
                return e;
            }),
        })),

    playerCharacter: null,
    setPlayerCharacter: (char) => set({ playerCharacter: char }),
}));
