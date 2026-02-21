'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PlayerNode {
    id: string;
    x: number;
    y: number;
    color: string;
}

interface GameCanvasProps {
    playerId: string;
}

export default function GameCanvas({ playerId }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [players, setPlayers] = useState<Record<string, PlayerNode>>({});

    // Use the actual DB ID passed down from Auth
    const myId = useRef(playerId);
    const myColor = useRef(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);

    useEffect(() => {
        const channel = supabase.channel('room:world', {
            config: {
                broadcast: { self: true },
            },
        });

        channel
            .on('broadcast', { event: 'cursor-pos' }, (payload) => {
                setPlayers((current) => ({
                    ...current,
                    [payload.payload.id]: {
                        id: payload.payload.id,
                        x: payload.payload.x,
                        y: payload.payload.y,
                        color: payload.payload.color
                    }
                }));
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully connected to Realtime channel');
                }
            });

        // Broadcast our mouse movement
        const handleMouseMove = (e: MouseEvent) => {
            channel.send({
                type: 'broadcast',
                event: 'cursor-pos',
                payload: {
                    id: myId.current,
                    x: e.clientX,
                    y: e.clientY,
                    color: myColor.current
                }
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            supabase.removeChannel(channel);
        };
    }, []);

    // Render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            // Resize canvas to parent container dynamically instead of window
            canvas.width = canvas.parentElement!.clientWidth;
            canvas.height = canvas.parentElement!.clientHeight;

            // Clear screen
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-background') || '#1c1917';
            ctx.fillStyle = bgColor; // Deep slate blue background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Basic Grid for environmental scale
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.1)'; // Slate-500 fading
            ctx.lineWidth = 1;
            const gridSize = 50;

            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw players
            Object.values(players).forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0; // reset
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [players]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
        />
    );
}
