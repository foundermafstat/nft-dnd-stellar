'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { renderLocation, renderPlayer, isTileWalkable } from '@/lib/tileRenderer';
import { LocationMap, LocationExit, TileType } from 'shared';
import TransitionModal from './TransitionModal';
import Tooltip from './Tooltip';
import NpcDialog from './NpcDialog';

interface PlayerNode {
    id: string;
    tileX: number;
    tileY: number;
    color: string;
}

interface NpcNode {
    id: string;
    name: string;
    title?: string;
    tile_x: number;
    tile_y: number;
    sprite_color: string;
}

interface HoveredEntity {
    type: 'player' | 'npc';
    name: string;
    title?: string;
    screenX: number;
    screenY: number;
}

interface GameCanvasProps {
    playerId: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
const TILE_SIZE = 36;
const DEFAULT_LOCATION_ID = '00000000-0000-4000-a000-000000000001';

export default function GameCanvas({ playerId }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [players, setPlayers] = useState<Record<string, PlayerNode>>({});
    const [locationMap, setLocationMap] = useState<LocationMap | null>(null);
    const [myPos, setMyPos] = useState<{ tileX: number; tileY: number }>({ tileX: 9, tileY: 14 });
    const [loading, setLoading] = useState(true);
    const [pendingExit, setPendingExit] = useState<LocationExit | null>(null);
    const [npcs, setNpcs] = useState<NpcNode[]>([]);
    const [hoveredEntity, setHoveredEntity] = useState<HoveredEntity | null>(null);
    const [activeNpc, setActiveNpc] = useState<NpcNode | null>(null);

    const myId = useRef(playerId);
    const myColor = useRef(`hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const currentLocationId = useRef<string>(DEFAULT_LOCATION_ID);
    const npcsRef = useRef<NpcNode[]>([]);

    // Keep npcsRef in sync
    useEffect(() => { npcsRef.current = npcs; }, [npcs]);

    // ── Parse location from API ────────────────────────────────────────
    function parseLocationFromAPI(loc: any): LocationMap {
        const coords = loc.coordinates;
        return {
            id: loc.id,
            name: loc.name,
            biome_type: loc.biome_type,
            room_type: loc.room_type,
            width: coords.width,
            height: coords.height,
            tiles: coords.tiles,
            spawn_points: coords.spawn_points || [],
            exits: coords.exits || [],
            threat_level: loc.threat_level,
        };
    }

    // ── Load NPCs for a location ───────────────────────────────────────
    async function loadNpcs(locId: string) {
        try {
            const res = await fetch(`${SERVER_URL}/api/location/${locId}/npcs`);
            const data = await res.json();
            if (data.success && data.npcs) {
                setNpcs(data.npcs.map((n: any) => ({
                    id: n.id,
                    name: n.name,
                    title: n.title,
                    tile_x: n.tile_x,
                    tile_y: n.tile_y,
                    sprite_color: n.sprite_color || '#a0522d',
                })));
            }
        } catch (err) {
            console.warn('Failed to load NPCs:', err);
            setNpcs([]);
        }
    }

    // ── Load a location by ID ──────────────────────────────────────────
    async function loadLocationById(locId: string, spawnLabel?: string) {
        setLoading(true);
        setActiveNpc(null);
        try {
            const res = await fetch(`${SERVER_URL}/api/location/${locId}`);
            const data = await res.json();
            if (data.success && data.location) {
                const map = parseLocationFromAPI(data.location);
                setLocationMap(map);
                currentLocationId.current = map.id;

                let spawn = map.spawn_points[0];
                if (spawnLabel) {
                    const labeled = map.spawn_points.find(sp => sp.label === spawnLabel);
                    if (labeled) spawn = labeled;
                }
                if (spawn) {
                    setMyPos({ tileX: spawn.x, tileY: spawn.y });
                    persistPosition(map.id, spawn.x, spawn.y);
                }

                subscribeToLocation(map.id);
                await loadNpcs(map.id);
            } else {
                loadFallbackLocation();
            }
        } catch {
            loadFallbackLocation();
        } finally {
            setLoading(false);
        }
    }

    // ── Persist position ───────────────────────────────────────────────
    function persistPosition(locId: string, tileX: number, tileY: number) {
        fetch(`${SERVER_URL}/api/player/${myId.current}/position`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationId: locId, tileX, tileY }),
        }).catch(console.error);
    }

    // ── Subscribe to per-location channel ──────────────────────────────
    function subscribeToLocation(locId: string) {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        setPlayers({});

        const channel = supabase.channel(`room:location:${locId}`, {
            config: { broadcast: { self: true } },
        });

        channel
            .on('broadcast', { event: 'player-pos' }, (payload) => {
                setPlayers(cur => ({
                    ...cur,
                    [payload.payload.id]: {
                        id: payload.payload.id,
                        tileX: payload.payload.tileX,
                        tileY: payload.payload.tileY,
                        color: payload.payload.color,
                    },
                }));
            })
            .subscribe();

        channelRef.current = channel;
    }

    // ── Initial load ───────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            try {
                const posRes = await fetch(`${SERVER_URL}/api/player/${myId.current}/position`);
                const posData = await posRes.json();
                if (posData.success && posData.position) {
                    const pos = posData.position;
                    await loadLocationById(pos.location_id);
                    setMyPos({ tileX: pos.tile_x, tileY: pos.tile_y });
                } else {
                    await loadLocationById(DEFAULT_LOCATION_ID);
                }
            } catch {
                await loadLocationById(DEFAULT_LOCATION_ID);
            }
        }
        init();
        return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
    }, []);

    // ── Broadcast position ─────────────────────────────────────────────
    useEffect(() => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'player-pos',
                payload: { id: myId.current, tileX: myPos.tileX, tileY: myPos.tileY, color: myColor.current },
            });
        }
    }, [myPos]);

    // ── Check NPC at tile ──────────────────────────────────────────────
    function npcAtTile(tileX: number, tileY: number): NpcNode | undefined {
        return npcsRef.current.find(n => n.tile_x === tileX && n.tile_y === tileY);
    }

    // ── Check adjacency ────────────────────────────────────────────────
    function isAdjacent(ax: number, ay: number, bx: number, by: number): boolean {
        return Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1 && !(ax === bx && ay === by);
    }

    // ── Find exit ──────────────────────────────────────────────────────
    function findExitAtTile(tileX: number, tileY: number): LocationExit | undefined {
        if (!locationMap) return undefined;
        return locationMap.exits.find(e => e.tile_x === tileX && e.tile_y === tileY);
    }

    // ── Click-to-Move with NPC collision and dialog ────────────────────
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!locationMap || !canvasRef.current || pendingExit) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const camX = myPos.tileX * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
        const camY = myPos.tileY * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;

        const tileX = Math.floor((clickX + camX) / TILE_SIZE);
        const tileY = Math.floor((clickY + camY) / TILE_SIZE);

        // Check if clicking an NPC when adjacent → open dialog
        const clickedNpc = npcAtTile(tileX, tileY);
        if (clickedNpc && isAdjacent(myPos.tileX, myPos.tileY, tileX, tileY)) {
            setActiveNpc(clickedNpc);
            return;
        }

        // Can't walk onto NPC tiles
        if (clickedNpc) return;

        // Exit check
        const exit = findExitAtTile(tileX, tileY);
        if (exit) {
            setMyPos({ tileX, tileY });
            setPendingExit(exit);
            return;
        }

        if (isTileWalkable(locationMap, tileX, tileY)) {
            setMyPos({ tileX, tileY });
            persistPosition(currentLocationId.current, tileX, tileY);
        }
    }, [locationMap, myPos, pendingExit, npcs]);

    // ── Mouse hover detection ──────────────────────────────────────────
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!locationMap || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const camX = myPos.tileX * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
        const camY = myPos.tileY * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;

        const tileX = Math.floor((mouseX + camX) / TILE_SIZE);
        const tileY = Math.floor((mouseY + camY) / TILE_SIZE);

        // Check NPC hover
        const npc = npcAtTile(tileX, tileY);
        if (npc) {
            setHoveredEntity({
                type: 'npc',
                name: npc.name,
                title: npc.title,
                screenX: mouseX,
                screenY: mouseY,
            });
            return;
        }

        // Check player hover (including self)
        const hPlayer = Object.values(players).find(p => p.tileX === tileX && p.tileY === tileY);
        if (hPlayer) {
            setHoveredEntity({
                type: 'player',
                name: hPlayer.id === myId.current ? 'You' : `Player`,
                screenX: mouseX,
                screenY: mouseY,
            });
            return;
        }

        // Check self
        if (tileX === myPos.tileX && tileY === myPos.tileY) {
            setHoveredEntity({
                type: 'player',
                name: 'You',
                screenX: mouseX,
                screenY: mouseY,
            });
            return;
        }

        setHoveredEntity(null);
    }, [locationMap, myPos, players, npcs]);

    const handleMouseLeave = useCallback(() => setHoveredEntity(null), []);

    // ── Transition handlers ────────────────────────────────────────────
    function handleTransitionConfirm() {
        if (!pendingExit) return;
        const exit = pendingExit;
        setPendingExit(null);
        loadLocationById(exit.target_location_id, exit.spawn_label);
    }

    function handleTransitionCancel() { setPendingExit(null); }

    // ── Fallback location ──────────────────────────────────────────────
    function loadFallbackLocation() {
        const W = TileType.Wall, F = TileType.Floor, D = TileType.Door;
        const FP = TileType.Fireplace, TB = TileType.Table, CH = TileType.Chair;
        const BA = TileType.Bar, BR = TileType.Barrel, RG = TileType.Rug, V = TileType.Void;
        setLocationMap({
            id: 'fallback', name: 'Tavern', biome_type: 'HubRegion', room_type: 'SafeZone',
            width: 12, height: 10, threat_level: 0, spawn_points: [{ x: 5, y: 8 }], exits: [],
            tiles: [
                [W, W, W, W, W, W, W, W, W, W, W, W], [W, F, FP, F, F, F, F, F, F, F, F, W],
                [W, F, F, F, F, RG, RG, F, F, F, F, W], [W, F, TB, CH, F, RG, RG, F, TB, CH, F, W],
                [W, F, CH, TB, F, F, F, F, CH, TB, F, W], [W, F, F, F, F, F, F, F, F, F, F, W],
                [W, BA, BA, BA, F, F, F, F, BR, BR, F, W], [W, F, F, F, F, F, F, F, F, F, F, W],
                [W, W, W, W, W, D, D, W, W, W, W, W], [V, V, V, V, V, F, F, V, V, V, V, V],
            ],
        });
        setMyPos({ tileX: 5, tileY: 8 });
    }

    // ── Render NPC on canvas ───────────────────────────────────────────
    function renderNpc(ctx: CanvasRenderingContext2D, npc: NpcNode, camX: number, camY: number) {
        const px = npc.tile_x * TILE_SIZE - camX + TILE_SIZE / 2;
        const py = npc.tile_y * TILE_SIZE - camY + TILE_SIZE / 2;
        const r = TILE_SIZE * 0.35;

        // Diamond shape for NPCs
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
        ctx.fillStyle = npc.sprite_color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Name label
        ctx.fillStyle = 'rgba(10, 8, 6, 0.7)';
        ctx.font = 'bold 9px serif';
        const nameWidth = ctx.measureText(npc.name).width;
        ctx.fillRect(px - nameWidth / 2 - 3, py - TILE_SIZE * 0.7 - 7, nameWidth + 6, 12);
        ctx.fillStyle = '#d4a854';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, px, py - TILE_SIZE * 0.7);
        ctx.textAlign = 'start';
    }

    // ── Render Loop ─────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement || !locationMap) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            canvas.width = canvas.parentElement!.clientWidth;
            canvas.height = canvas.parentElement!.clientHeight;

            const camX = myPos.tileX * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
            const camY = myPos.tileY * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;

            renderLocation(ctx, locationMap, camX, camY, TILE_SIZE, canvas.width, canvas.height);

            // Exit indicators
            locationMap.exits.forEach(exit => {
                const px = exit.tile_x * TILE_SIZE - camX + TILE_SIZE / 2;
                const py = exit.tile_y * TILE_SIZE - camY + TILE_SIZE / 2;
                const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
                ctx.beginPath();
                ctx.arc(px, py, TILE_SIZE * 0.2 * (0.8 + 0.2 * pulse), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(217, 119, 6, ${0.4 + 0.3 * pulse})`;
                ctx.fill();
                ctx.save();
                ctx.shadowBlur = 12;
                ctx.shadowColor = 'rgba(217, 119, 6, 0.5)';
                ctx.fill();
                ctx.restore();
            });

            // Draw NPCs
            npcsRef.current.forEach(npc => renderNpc(ctx, npc, camX, camY));

            // Draw other players
            Object.values(players).forEach(p => {
                if (p.id !== myId.current) {
                    renderPlayer(ctx, p.tileX, p.tileY, p.color, TILE_SIZE, camX, camY, false);
                }
            });

            // Draw local player
            renderPlayer(ctx, myPos.tileX, myPos.tileY, myColor.current, TILE_SIZE, camX, camY, true);

            // HUD
            ctx.font = 'bold 14px serif';
            const textWidth = ctx.measureText(`📍 ${locationMap.name}`).width;
            ctx.fillStyle = 'rgba(10, 8, 6, 0.75)';
            ctx.fillRect(8, 8, textWidth + 24, 32);
            ctx.strokeStyle = 'rgba(176, 138, 74, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(8, 8, textWidth + 24, 32);
            ctx.fillStyle = '#b08a4a';
            ctx.fillText(`📍 ${locationMap.name}`, 16, 29);

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [players, myPos, locationMap, npcs]);

    if (loading) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0806]">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />

            {/* Tooltip */}
            {hoveredEntity && (
                <Tooltip
                    x={hoveredEntity.screenX}
                    y={hoveredEntity.screenY}
                    name={hoveredEntity.name}
                    title={hoveredEntity.title}
                    type={hoveredEntity.type}
                />
            )}

            {/* Transition modal */}
            {pendingExit && (
                <TransitionModal
                    targetName={pendingExit.target_location_name}
                    onConfirm={handleTransitionConfirm}
                    onCancel={handleTransitionCancel}
                />
            )}

            {/* NPC Dialog */}
            {activeNpc && (
                <NpcDialog
                    npcId={activeNpc.id}
                    npcName={activeNpc.name}
                    npcTitle={activeNpc.title}
                    onClose={() => setActiveNpc(null)}
                />
            )}
        </>
    );
}
