'use client';

import { Shield, Sparkles, Map, Database, Crown, ChevronDown, Swords, Scroll } from "lucide-react";
import FreighterAuthButton from "./FreighterAuthButton";
import { useEffect, useRef, useState } from "react";

// Hook for scroll animations
function useIntersectionObserver(options = {}) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, ...options });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [options]);

    return [ref, isIntersecting] as const;
}

// FadeIn Wrapper with cinematic bezier curves
function FadeIn({ children, delay = 0, direction = 'up', distance = '12' }: { children: React.ReactNode, delay?: number, direction?: 'up' | 'left' | 'right' | 'down', distance?: string }) {
    const [ref, isVisible] = useIntersectionObserver();

    let transformClass = `translate-y-${distance}`;
    if (direction === 'down') transformClass = `-translate-y-${distance}`;
    if (direction === 'left') transformClass = `translate-x-${distance}`;
    if (direction === 'right') transformClass = `-translate-x-${distance}`;

    return (
        <div
            ref={ref}
            className={`transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] fill-mode-forwards ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${transformClass} scale-95`}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

// Ultra-Premium Dark Fantasy NFT Card
function PremiumCard({
    title,
    type,
    rarity,
    description,
    imageSrc,
    icon: Icon,
    glowColor,
    delay = 0
}: {
    title: string,
    type: string,
    rarity: string,
    description: string,
    imageSrc: string,
    icon: any,
    glowColor: string,
    delay?: number
}) {
    // Dynamic styles based on rarity
    const rarityConfig: Record<string, { border: string, text: string, bg: string, tag: string }> = {
        'Mythic': {
            border: 'from-amber-400 via-amber-600 to-amber-900',
            text: 'text-amber-300',
            bg: 'bg-amber-950/20',
            tag: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        },
        'Legendary': {
            border: 'from-rose-500 via-red-700 to-red-950',
            text: 'text-rose-300',
            bg: 'bg-red-950/20',
            tag: 'bg-red-500/10 text-red-400 border-red-500/30'
        },
        'Epic': {
            border: 'from-emerald-400 via-emerald-700 to-emerald-950',
            text: 'text-emerald-300',
            bg: 'bg-emerald-950/20',
            tag: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }
    };

    const theme = rarityConfig[rarity] || rarityConfig['Legendary'];

    return (
        <FadeIn delay={delay} direction="up" distance="16">
            <div className="relative group w-full max-w-[400px] mx-auto perspective-1000">
                {/* 3D Wrapper */}
                <div className="relative w-full rounded-2xl transition-all duration-[800ms] ease-out group-hover:[transform:rotateX(2deg)_rotateY(-2deg)_scale(1.02)] transform-style-3d shadow-[0_0_50px_rgba(0,0,0,0.8)] group-hover:shadow-[0_20px_80px_rgba(0,0,0,0.9)] z-10">

                    {/* Glowing Backplane */}
                    <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-b ${theme.border} opacity-40 group-hover:opacity-100 blur-sm transition-opacity duration-700`}></div>

                    {/* Metallic Outer Border */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${theme.border} opacity-50 z-0`}></div>

                    {/* Card Inner Background (Onyx/Obsidian texture simulation) */}
                    <div className="absolute inset-[1px] rounded-[15px] bg-[#100c08] z-10 overflow-hidden flex flex-col justify-end">
                        {/* Noise Texture */}
                        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                        {/* Interactive Ambient Gradient */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-[radial-gradient(circle_at_50%_0%,_${glowColor},_transparent_70%)] mix-blend-screen pointer-events-none`}></div>
                        <div className={`absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t ${theme.bg} to-transparent opacity-50`}></div>
                    </div>

                    {/* Content Layer (3D Translated) */}
                    <div className="relative z-20 flex flex-col h-full p-1 [transform:translateZ(20px)] pointer-events-none">

                        {/* Inner Gold Frame */}
                        <div className="absolute inset-[3px] border border-white/5 rounded-[12px] pointer-events-none">
                            {/* Corner Ornaments */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-[10px]"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 rounded-tr-[10px]"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20 rounded-bl-[10px]"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-[10px]"></div>
                        </div>

                        {/* Top Bar */}
                        <div className="flex justify-between items-center px-4 pt-4 pb-2 z-30">
                            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${theme.tag} backdrop-blur-md`}>
                                <Sparkles className="w-3 h-3" />
                                <span className="text-[10px] font-serif tracking-widest uppercase font-bold">{rarity}</span>
                            </div>
                            <Icon className="w-5 h-5 text-stone-500/50 group-hover:text-stone-300 transition-colors duration-700" />
                        </div>

                        {/* Image Showcase Segment */}
                        <div className="relative h-[240px] w-full mt-2 flex items-center justify-center overflow-hidden z-20">
                            {/* Deep Background behind image */}
                            <div className="absolute inset-x-4 inset-y-0 rounded-lg bg-black/40 border border-white/5 shadow-inner"></div>

                            {/* Volumetric Light shaft behind image */}
                            <div className="absolute top-0 w-full h-[150%] bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 rotate-12 -translate-y-8 pointer-events-none blur-xl"></div>

                            {/* The 3D Image */}
                            <img
                                src={imageSrc}
                                alt={title}
                                className="relative z-30 w-full h-[120%] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            />
                        </div>

                        {/* Title and Lore Box */}
                        <div className="relative z-30 flexflex-col px-5 pt-6 pb-5 mt-auto border-t border-white/5 bg-gradient-to-t from-black/80 to-transparent rounded-b-[14px]">

                            <h3 className={`text-2xl font-serif font-bold tracking-tight mb-1 ${theme.text} drop-shadow-md`}>
                                {title}
                            </h3>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-serif tracking-widest text-stone-500 uppercase">{type}</span>
                                <div className="h-px w-8 bg-white/10"></div>
                            </div>

                            <p className="text-sm text-stone-400 font-serif leading-relaxed line-clamp-3 group-hover:text-stone-300 transition-colors">
                                {description}
                            </p>
                        </div>

                    </div>

                </div>
            </div>
        </FadeIn>
    );
}

interface WelcomeScreenProps {
    onAuth: (id: string | null) => void;
}

export default function WelcomeScreen({ onAuth }: WelcomeScreenProps) {
    return (
        <div className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-[#0a0806] text-stone-300 z-20 custom-scrollbar scroll-smooth selection:bg-amber-900/60 selection:text-amber-100">

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen w-full flex flex-col items-center justify-center pointer-events-auto">
                {/* Background Video Layer */}
                <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-[0.35] scale-[1.02]"
                    >
                        <source src="/videos/promo.mp4" type="video/mp4" />
                    </video>
                    {/* The crucial 60% gradient overlay from the bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#0a0806] to-transparent z-10 pointer-events-none"></div>
                    {/* Subtle vignette for cinematic framing */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_#0a0806_100%)] z-10 pointer-events-none opacity-80"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-20 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center mt-20">
                    <FadeIn delay={100} direction="up">
                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-amber-500/10 bg-amber-950/20 backdrop-blur-md mb-8 shadow-[0_0_40px_rgba(217,119,6,0.1)]">
                            <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
                            </span>
                            <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] text-amber-500/80 uppercase">The Genesis Build</span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={300} direction="up">
                        <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-serif tracking-tighter mb-6 leading-[0.85] text-stone-200 drop-shadow-2xl">
                            FORGE YOUR<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-900 italic pr-4">
                                LEGACY
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={500} direction="up">
                        <p className="max-w-2xl text-lg md:text-2xl text-stone-400 font-serif leading-relaxed mb-12 drop-shadow-md">
                            A procedural high-fantasy RPG governed by an AI Game Master.
                            Claim immemorial artifacts and conquer boundless worlds.
                        </p>
                    </FadeIn>

                    <FadeIn delay={700} direction="up">
                        <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
                            {/* Elaborate Auth Button Framing */}
                            <div className="relative group perspective-1000">
                                <div className="absolute -inset-1.5 rounded-lg bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-900 opacity-0 group-hover:opacity-100 transition duration-1000 blur-lg"></div>
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-800 to-amber-950 border border-amber-500/30"></div>
                                <div className="relative bg-[#020308] rounded-lg m-[1px] flex items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-transform duration-500 group-hover:scale-[0.98]">
                                    <FreighterAuthButton onAuthenticated={onAuth} />
                                </div>
                            </div>

                            <a href="#artifacts" className="group flex items-center gap-2 text-xs font-serif tracking-widest text-stone-500 hover:text-amber-500 transition-colors uppercase pt-2 sm:pt-0">
                                Read the Tomes <ChevronDown className="w-4 h-4 group-hover:translate-y-2 transition-transform" />
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* --- ARTIFACT SHOWCASE SECTION --- */}
            <section id="artifacts" className="relative w-full py-32 bg-[#0a0806] z-20">
                {/* Subtle fantasy grid or magic circles in background could go here. For now, deep black. */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1a0f00_0%,_#0a0806_100%)] opacity-40"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">

                    <div className="text-center mb-24">
                        <FadeIn delay={100} direction="up">
                            <h2 className="text-4xl md:text-6xl font-serif text-stone-200 mb-6 tracking-tight">Legendary Relics</h2>
                            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent mx-auto"></div>
                            <p className="mt-6 text-stone-400 font-serif max-w-xl mx-auto text-lg leading-relaxed">
                                Items born of code, bound to the ledger. Discover dynamic NFTs that evolve through your conquests.
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-14">
                        <PremiumCard
                            title="Astral Citadel Outpost"
                            type="Node Architecture"
                            rarity="Mythic"
                            description="A sovereign stronghold suspended in the æther. Grants its owner dominion over local generative quests and a tithe of all loot found within its borders."
                            imageSrc="/images/dnd1.png"
                            icon={Map}
                            glowColor="rgba(245, 158, 11, 0.4)"
                            delay={100}
                        />

                        <PremiumCard
                            title="Tome of the Forgotten"
                            type="Arcane Artifact"
                            rarity="Legendary"
                            description="Its pages rewrite themselves based on server events. Whispers forgotten truths to scholars, unlocking hidden dialogue paths with the Game Master."
                            imageSrc="/images/dnd2.png"
                            icon={Scroll}
                            glowColor="rgba(168, 85, 247, 0.4)"
                            delay={300}
                        />

                        <PremiumCard
                            title="Blade of the Obsidian Order"
                            type="Two-Handed Weapon"
                            rarity="Epic"
                            description="Forged in the deepest procedural abysses. Its edge grows sharper with every victory logged permanently on the Stellar blockchain."
                            imageSrc="/images/dnd3.png"
                            icon={Swords}
                            glowColor="rgba(6, 182, 212, 0.4)"
                            delay={500}
                        />
                    </div>
                </div>
            </section>

            {/* --- CALL TO ACTION FOOTER --- */}
            <footer className="relative w-full border-t border-amber-900/40 bg-[#050403] pb-16 pt-32 z-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_#1a0f00_0%,_#050403_100%)] opacity-80"></div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center relative z-10 text-center">
                    <Shield className="w-16 h-16 text-amber-800/60 mb-10 drop-shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
                    <h2 className="text-3xl md:text-4xl font-serif text-stone-200 mb-8 font-bold tracking-tight">Ready to step into the dark?</h2>

                    <div className="mb-20">
                        <FreighterAuthButton onAuthenticated={onAuth} />
                    </div>

                    <div className="flex gap-10 text-[10px] font-serif tracking-[0.2em] text-stone-600 uppercase mb-16">
                        <a href="#" className="hover:text-amber-500 transition-colors">Lore Database</a>
                        <a href="#" className="hover:text-amber-500 transition-colors">Contract Addr</a>
                        <a href="#" className="hover:text-amber-500 transition-colors">Chronicles</a>
                    </div>

                    <p className="text-stone-800 font-serif text-[10px] tracking-widest uppercase">
                        © 2026 NFT-DND Stellar Project.
                    </p>
                </div>
            </footer>

        </div>
    );
}
