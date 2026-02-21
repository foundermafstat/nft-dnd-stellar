import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane, useSphere, useConvexPolyhedron } from '@react-three/cannon';
import { PerspectiveCamera, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- PHYSICS FLOOR ---
function Floor() {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, -2, 0],
        material: { restitution: 0.1, friction: 0.8 }, // Wood-like
    }));
    return (
        <mesh ref={ref as any}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial transparent opacity={0.0} />
        </mesh>
    );
}

// --- DICE GEOMETRY GENERATORS ---
// standard radius around 1 unit for scale
const radius = 1;

// We use basic spheres for the collision bodies of the higher-poly dice 
// because true convex polyhedrons can be computationally heavy in Cannon 
// and spheres bounce more naturally like real dice anyway. 
// For D4, D6, D8 we will use their specific shapes if possible.

interface DiceProps {
    type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
    isRolling: boolean;
    serverResult: number | null;
    onRollComplete: () => void;
}

function GenericDice({ type, isRolling, serverResult, onRollComplete }: DiceProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Choose the bounding box/sphere scale based on type
    const size = type === 'd6' ? 1.2 : type === 'd4' ? 1.5 : 1.3;

    // For simplicity, we wrap all dice in a sphere collider so they roll smoothly and chaotically well.
    // In a AAA game, we'd use useConvexPolyhedron, but useSphere prevents the dice from 
    // just instantly sitting flat and dying.
    const [ref, api] = useSphere(() => ({
        mass: 1.5,
        position: [0, 8, 0],
        args: [size / 1.5], // Radius of the bounding sphere
        material: { restitution: 0.7, friction: 0.2 }, // Bouncy
    }));

    useEffect(() => {
        if (isRolling && document.visibilityState === 'visible') {
            setIsVisible(true);

            // Randomize Drop
            api.position.set(
                (Math.random() - 0.5) * 4,
                8 + Math.random() * 4,
                (Math.random() - 0.5) * 4
            );

            api.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Throw it hard
            api.angularVelocity.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30
            );

            api.velocity.set(0, -10, 0); // Throw downwards with force

            // Result enforce logic
            const settleTimer = setTimeout(() => {
                // Kill physics momentum
                api.angularVelocity.set(0, 0, 0);
                api.velocity.set(0, 0, 0);

                // Snap to correct face
                if (serverResult !== null) {
                    forceRotationToFace(type, serverResult, api);
                }

                onRollComplete();

                setTimeout(() => setIsVisible(false), 3000);

            }, 2500);

            return () => clearTimeout(settleTimer);
        }
    }, [isRolling, serverResult, type, api, onRollComplete]);

    // This forces the 3D model to face the camera based on the result.
    // In a fully textured asset, we would calculate the exact quaternion of the numbered face.
    // Since we are mocking the geometry right now, we just snap it perfectly flat.
    const forceRotationToFace = (diceType: string, result: number, physicsApi: any) => {
        // Just level it out for the "snap" effect
        physicsApi.rotation.set(0, 0, 0);
    };

    // Determine geometry based on type
    let geometry;
    switch (type) {
        case 'd4': geometry = <tetrahedronGeometry args={[radius]} />; break;
        case 'd6': geometry = <boxGeometry args={[radius, radius, radius]} />; break;
        case 'd8': geometry = <octahedronGeometry args={[radius]} />; break;
        case 'd10':
            geometry = <icosahedronGeometry args={[radius, 0]} />;
            break;
        case 'd12': geometry = <dodecahedronGeometry args={[radius]} />; break;
        case 'd20': geometry = <icosahedronGeometry args={[radius, 0]} />; break;
        default: geometry = <boxGeometry args={[radius, radius, radius]} />;
    }

    const colors = {
        d4: '#ec4899', // Pink
        d6: '#eab308', // Yellow
        d8: '#3b82f6', // Blue
        d10: '#a855f7', // Purple
        d12: '#22c55e', // Green
        d20: '#ef4444', // Red
    };

    const matColor = colors[type];

    // Hide by scaling to zero if not visible, keeping physics body alive
    return (
        <mesh ref={ref as any} castShadow receiveShadow scale={isVisible ? 1 : 0}>
            {geometry}
            <meshStandardMaterial
                color={matColor}
                metalness={0.6}
                roughness={0.2}
                emissive={matColor}
                emissiveIntensity={0.2}
            />
            {/* Adding a wireframe overlay so the edges are visible */}
            <mesh scale={1.001}>
                {geometry}
                <meshBasicMaterial color="#ffffff" wireframe />
            </mesh>
        </mesh>
    );
}

// --- MAIN WRAPPER ---
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface OverlayProps {
    rolling: boolean;
    diceType: DiceType;
    result: number | null;
    onReset: () => void;
}

export default function DiceOverlay({ rolling, diceType, result, onReset }: OverlayProps) {
    // We KEEP the canvas mounted always to prevent WebGL initialization lag.
    // We just hide it via CSS when not in use.
    const isActive = rolling || result !== null;

    return (
        <div className={`fixed inset-0 w-screen h-screen z-[100] pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>

            <div className="absolute inset-0 w-full h-full">
                {/* The React Three Fiber Canvas */}
                <Canvas shadows gl={{ antialias: true, alpha: true }}>
                    <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={35} />

                    <ambientLight intensity={0.4} />
                    <directionalLight
                        position={[10, 15, 10]}
                        intensity={1.5}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                    />
                    <spotLight position={[-10, 10, -10]} intensity={2} color="#4c1d95" />

                    <Environment preset="city" />

                    <Physics gravity={[0, -30, 0]} iterations={15}>
                        <Floor />
                        <GenericDice
                            type={diceType}
                            isRolling={rolling}
                            serverResult={result}
                            onRollComplete={() => {
                                // Will show the 2D UI result now
                            }}
                        />
                    </Physics>
                </Canvas>
            </div>

            {/* 2D Cinematic overlay for the result */}
            {result && !rolling && (
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 pointer-events-none">
                    <span className="text-xl font-mono text-slate-400 tracking-[0.5em] uppercase mb-4 drop-shadow-lg">
                        You Rolled
                    </span>
                    <h2 className="text-[12rem] font-serif font-black text-amber-500 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)] leading-none">
                        {result}
                    </h2>

                    {/* Add flavor text for Nat 20 or Nat 1 */}
                    {diceType === 'd20' && result === 20 && (
                        <span className="text-3xl font-serif text-white tracking-widest uppercase mt-4 animate-pulse drop-shadow-[0_0_20px_white]">
                            Critical Success
                        </span>
                    )}
                    {diceType === 'd20' && result === 1 && (
                        <span className="text-3xl font-serif text-red-600 tracking-widest uppercase mt-4 animate-pulse drop-shadow-[0_0_20px_red]">
                            Critical Failure
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
