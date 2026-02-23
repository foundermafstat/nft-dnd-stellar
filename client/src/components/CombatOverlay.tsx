'use client';

import { useState, useEffect, useRef } from 'react';
import { CombatState, CombatEntity, CombatLog, CombatAction, CombatActionType } from 'shared';
import { SERVER_URL } from '@/lib/config';

interface CombatOverlayProps {
    combatState: CombatState;
    playerId: string;
    characterId: string;
    onCombatUpdate: (state: CombatState) => void;
    onCombatEnd: (result: 'VICTORY' | 'DEFEAT') => void;
    onSelectTarget: (callback: (targetId: string) => void) => void;
}

export default function CombatOverlay({
    combatState,
    playerId,
    characterId,
    onCombatUpdate,
    onCombatEnd,
    onSelectTarget,
}: CombatOverlayProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAction, setSelectedAction] = useState<CombatActionType | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);
    const entityId = `player_${characterId}`;

    const isMyTurn = combatState.activeEntityId === entityId;
    const myEntity = combatState.entities[entityId];
    const activeEntity = combatState.entities[combatState.activeEntityId];

    // Auto-scroll combat log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatState.logs.length]);

    // Detect combat end
    useEffect(() => {
        if (combatState.status === 'VICTORY' || combatState.status === 'DEFEAT') {
            onCombatEnd(combatState.status);
        }
    }, [combatState.status]);

    async function submitAction(action: CombatAction) {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${SERVER_URL}/api/combat/${combatState.combatId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: characterId, action }),
            });
            const data = await res.json();
            if (data.success && data.combat) {
                onCombatUpdate(data.combat);
            }
        } catch (err) {
            console.error('Combat action failed:', err);
        } finally {
            setIsSubmitting(false);
            setSelectedAction(null);
        }
    }

    function handleAttack(type: 'MELEE_ATTACK' | 'RANGED_ATTACK') {
        setSelectedAction(type);
        onSelectTarget((targetId: string) => {
            submitAction({ type, targetId });
        });
    }

    function handleSpell() {
        setSelectedAction('CAST_SPELL');
        onSelectTarget((targetId: string) => {
            submitAction({ type: 'CAST_SPELL', targetId });
        });
    }

    async function handleEndTurn() {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${SERVER_URL}/api/combat/${combatState.combatId}/end-turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: characterId }),
            });
            const data = await res.json();
            if (data.success && data.combat) {
                onCombatUpdate(data.combat);
            }
        } catch (err) {
            console.error('End turn failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    }

    function getEntityColor(entity: CombatEntity): string {
        if (entity.id === entityId) return '#4ade80'; // Green for self
        if (entity.type === 'PLAYER') return '#60a5fa'; // Blue for allies
        return '#ef4444'; // Red for enemies
    }

    function getHpBarColor(hp: number, maxHp: number): string {
        const ratio = hp / maxHp;
        if (ratio > 0.6) return '#22c55e';
        if (ratio > 0.3) return '#eab308';
        return '#ef4444';
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* ── Turn Queue Bar (Top) ─────────────────────────── */}
            <div className="pointer-events-auto absolute top-0 left-0 right-0 flex items-center justify-center gap-1 p-2 bg-gradient-to-b from-black/90 to-transparent">
                <span className="text-amber-400/70 text-xs font-bold mr-2">
                    Round {combatState.round}
                </span>
                {combatState.turnQueue.map((id) => {
                    const entity = combatState.entities[id];
                    if (!entity) return null;
                    const isActive = id === combatState.activeEntityId;
                    const isDead = entity.hp <= 0;
                    return (
                        <div
                            key={id}
                            className={`
                                flex flex-col items-center px-2 py-1 rounded-md text-xs font-bold transition-all
                                ${isActive ? 'bg-amber-600/40 ring-1 ring-amber-400 scale-110' : 'bg-black/50'}
                                ${isDead ? 'opacity-30 line-through' : ''}
                            `}
                            style={{ color: getEntityColor(entity) }}
                        >
                            <span className="truncate max-w-[60px]">{entity.name}</span>
                            <div className="w-10 h-1 mt-0.5 rounded-full bg-gray-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${(entity.hp / entity.maxHp) * 100}%`,
                                        backgroundColor: getHpBarColor(entity.hp, entity.maxHp),
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Combat Log (Right side) ──────────────────────── */}
            <div className="pointer-events-auto absolute right-2 top-14 bottom-20 w-64 bg-black/80 border border-amber-900/30 rounded-lg overflow-hidden flex flex-col">
                <div className="px-3 py-1.5 bg-amber-900/30 text-amber-400 text-xs font-bold border-b border-amber-900/20">
                    ⚔️ Combat Log
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
                    {combatState.logs.map((log, i) => (
                        <div key={log.id || i} className="text-gray-300 leading-tight">
                            {log.isHit !== undefined && (
                                <span className={log.isHit ? 'text-red-400' : 'text-gray-500'}>
                                    [{log.isHit ? 'HIT' : 'MISS'}]
                                    {log.roll && ` (${log.roll.total})`}
                                    {log.damage ? ` -${log.damage}HP` : ''}
                                    {' '}
                                </span>
                            )}
                            <span className="text-amber-100/80">{log.narrative}</span>
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

            {/* ── Action Panel (Bottom) ────────────────────────── */}
            {isMyTurn && myEntity && myEntity.hp > 0 && (
                <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/90 border border-amber-700/40 rounded-xl shadow-2xl">
                    <span className="text-amber-400 text-xs font-bold mr-2">YOUR TURN</span>

                    <button
                        onClick={() => handleAttack('MELEE_ATTACK')}
                        disabled={isSubmitting}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all
                            ${selectedAction === 'MELEE_ATTACK'
                                ? 'bg-red-600 text-white ring-2 ring-red-400'
                                : 'bg-red-900/50 text-red-300 hover:bg-red-800/60'}
                            disabled:opacity-40`}
                    >
                        ⚔️ Melee
                    </button>

                    <button
                        onClick={() => handleAttack('RANGED_ATTACK')}
                        disabled={isSubmitting}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all
                            ${selectedAction === 'RANGED_ATTACK'
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/60'}
                            disabled:opacity-40`}
                    >
                        🏹 Ranged
                    </button>

                    <button
                        onClick={handleSpell}
                        disabled={isSubmitting}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all
                            ${selectedAction === 'CAST_SPELL'
                                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/60'}
                            disabled:opacity-40`}
                    >
                        ✨ Spell
                    </button>

                    <button
                        disabled={isSubmitting}
                        className="px-3 py-2 rounded-lg text-sm font-bold bg-green-900/50 text-green-300 hover:bg-green-800/60 disabled:opacity-40 transition-all"
                    >
                        🧪 Item
                    </button>

                    <div className="w-px h-8 bg-amber-800/40" />

                    <button
                        onClick={handleEndTurn}
                        disabled={isSubmitting}
                        className="px-3 py-2 rounded-lg text-sm font-bold bg-amber-900/50 text-amber-300 hover:bg-amber-800/60 disabled:opacity-40 transition-all"
                    >
                        ⏭️ End Turn
                    </button>
                </div>
            )}

            {/* ── Waiting indicator ─────────────────────────────── */}
            {!isMyTurn && combatState.status === 'IN_PROGRESS' && activeEntity && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/80 border border-gray-700/40 rounded-xl">
                    <span className="text-gray-400 text-sm animate-pulse">
                        ⏳ {activeEntity.name}'s turn...
                    </span>
                </div>
            )}

            {/* ── Victory/Defeat banner ─────────────────────────── */}
            {(combatState.status === 'VICTORY' || combatState.status === 'DEFEAT') && (
                <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70 z-60">
                    <div className={`text-center px-12 py-8 rounded-2xl border-2 ${combatState.status === 'VICTORY'
                            ? 'bg-green-950/80 border-green-500 text-green-300'
                            : 'bg-red-950/80 border-red-500 text-red-300'
                        }`}>
                        <div className="text-4xl font-black mb-2">
                            {combatState.status === 'VICTORY' ? '⚔️ VICTORY!' : '💀 DEFEAT!'}
                        </div>
                        <div className="text-sm opacity-70">
                            {combatState.status === 'VICTORY'
                                ? 'All enemies have been vanquished.'
                                : 'Your party has fallen in battle.'}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Target selection hint ─────────────────────────── */}
            {selectedAction && (
                <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-900/80 text-amber-200 text-sm font-bold rounded-lg animate-pulse">
                    🎯 Click an enemy to target
                </div>
            )}
        </div>
    );
}
