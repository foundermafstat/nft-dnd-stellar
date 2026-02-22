'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Dices, Save, Sparkles, Minus, Plus } from 'lucide-react';
import { HeroClass } from '../../../../shared/src/models/player';
import { Ancestry, ANCESTRIES, calculateModifier } from '../../../../shared/src/models/rules';
import { useAuth } from '@/context/AuthContext';
import { SERVER_URL } from '@/lib/config';


function StatRow({ label, value, min, max, availablePoints, onChange }: { label: string; value: number, min: number, max: number, availablePoints: number, onChange: (val: number) => void }) {
    const mod = calculateModifier(value);
    const modStr = mod > 0 ? `+${mod}` : mod.toString();
    const colorClass = mod > 0 ? 'text-primary' : mod < 0 ? 'text-destructive' : 'text-muted-foreground';

    const canDecrease = value > min;
    const canIncrease = value < max && availablePoints > 0;

    return (
        <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex flex-col">
                <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">Min: {min} / Max: {max}</span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => canDecrease && onChange(value - 1)}
                    disabled={!canDecrease}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <span className="font-serif text-xl text-foreground w-8 text-center">{value}</span>

                <button
                    onClick={() => canIncrease && onChange(value + 1)}
                    disabled={!canIncrease}
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <span className={`font-mono text-sm min-w-[30px] text-right ${colorClass}`}>{modStr}</span>
            </div>
        </div>
    );
}

export default function CreateHeroPage() {
    const router = useRouter();
    const { playerId, isLoading } = useAuth();

    // Form state
    const [name, setName] = useState('');
    const [selectedAncestry, setSelectedAncestry] = useState<Ancestry>(Ancestry.Human);
    const [selectedClass, setSelectedClass] = useState<HeroClass>(HeroClass.Fighter);
    const [alignment, setAlignment] = useState('Neutral');
    const [background, setBackground] = useState('');

    // Stats state
    const [stats, setStats] = useState({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const [isSaving, setIsSaving] = useState(false);

    const TOTAL_POINTS = 72;

    const limits = useMemo(() => {
        const l = {
            str: { min: 3, max: 18 },
            dex: { min: 3, max: 18 },
            con: { min: 3, max: 18 },
            int: { min: 3, max: 18 },
            wis: { min: 3, max: 18 },
            cha: { min: 3, max: 18 },
        };

        if (selectedClass === HeroClass.Fighter) l.str.min = 12;
        if (selectedClass === HeroClass.Priest) l.wis.min = 12;
        if (selectedClass === HeroClass.Thief) l.dex.min = 12;
        if (selectedClass === HeroClass.Wizard) l.int.min = 12;

        switch (selectedAncestry) {
            case Ancestry.Dwarf:
                l.con.min = Math.max(l.con.min, 10);
                l.dex.max = Math.min(l.dex.max, 14);
                break;
            case Ancestry.Elf:
                l.dex.min = Math.max(l.dex.min, 10);
                l.con.max = Math.min(l.con.max, 14);
                break;
            case Ancestry.Goblin:
                l.str.max = Math.min(l.str.max, 12);
                break;
            case Ancestry.Halfling:
                l.str.max = Math.min(l.str.max, 10);
                break;
            case Ancestry.HalfOrc:
                l.str.min = Math.max(l.str.min, 10);
                l.int.max = Math.min(l.int.max, 14);
                break;
            case Ancestry.Human:
                break;
        }
        return l;
    }, [selectedAncestry, selectedClass]);

    useEffect(() => {
        setStats(prev => {
            const next = { ...prev };
            let changed = false;
            for (const key of Object.keys(next) as Array<keyof typeof next>) {
                if (next[key] < limits[key].min) {
                    next[key] = limits[key].min;
                    changed = true;
                }
                if (next[key] > limits[key].max) {
                    next[key] = limits[key].max;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [limits]);

    const currentPoints = Object.values(stats).reduce((a, b) => a + b, 0);
    const availablePoints = TOTAL_POINTS - currentPoints;

    // AI Generation State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!isLoading && !playerId) {
            router.push('/');
        }
    }, [isLoading, playerId, router]);

    const handleStatChange = (stat: keyof typeof stats, value: number) => {
        setStats(prev => ({ ...prev, [stat]: value }));
    };

    const generateWithAI = async () => {
        if (!aiPrompt.trim()) return alert("Please enter a short prompt describing your hero.");

        setIsGenerating(true);
        try {

            const response = await fetch(`${SERVER_URL}/api/character/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt })
            });

            if (!response.ok) throw new Error("AI Generation Failed");
            const data = await response.json();

            if (data.success && data.character) {
                const c = data.character;
                setName(c.name || '');
                if (Object.values(Ancestry).includes(c.ancestry)) setSelectedAncestry(c.ancestry as Ancestry);
                if (Object.values(HeroClass).includes(c.class)) setSelectedClass(c.class as HeroClass);
                if (c.alignment) setAlignment(c.alignment);
                if (c.background) setBackground(c.background);
                if (c.stats) {
                    setStats({
                        str: c.stats.str || 10,
                        dex: c.stats.dex || 10,
                        con: c.stats.con || 10,
                        int: c.stats.int || 10,
                        wis: c.stats.wis || 10,
                        cha: c.stats.cha || 10,
                    });
                }
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate hero. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("Hero Name is required.");
        if (availablePoints !== 0) return alert("You must allocate all attribute points.");

        setIsSaving(true);
        // Base HP starts as roughly max of the class hit die. Let's do a strict approximation.
        let baseHp = 4;
        if (selectedClass === HeroClass.Fighter) baseHp = 8;
        if (selectedClass === HeroClass.Priest) baseHp = 6;

        const conMod = calculateModifier(stats.con);
        let maxHp = Math.max(1, baseHp + conMod);

        // Dwarf Stout feature gives +2 HP
        if (selectedAncestry === Ancestry.Dwarf) maxHp += 2;

        // Base AC = 10 + DEX mod
        const ac = 10 + calculateModifier(stats.dex);

        try {

            const response = await fetch(`${SERVER_URL}/api/character/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    name,
                    ancestry: selectedAncestry,
                    class: selectedClass,
                    alignment,
                    background,
                    stats,
                    hp_current: maxHp,
                    hp_max: maxHp,
                    ac
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create character');
            }

            // Redirect to hub
            router.push('/');
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
            setIsSaving(false);
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-background text-foreground overflow-y-auto custom-scrollbar selection:bg-primary/20 selection:text-primary-foreground font-serif">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--color-muted)_0%,_var(--color-background)_100%)] opacity-80 pointer-events-none fixed"></div>
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none fixed" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors bg-secondary/40 px-4 py-2 rounded-full border border-border">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="font-mono text-xs uppercase tracking-widest">Flee to Hub</span>
                    </button>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-foreground via-muted-foreground to-foreground drop-shadow-md">Forge Your Hero</h1>
                    <div className="w-[124px]"></div> {/* Spacer for symmetry */}
                </div>

                {/* AI Generator Section */}
                <div className="mb-10 bg-card border border-border rounded-2xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
                    <div className="flex flex-col md:flex-row gap-4 items-end relative z-10">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-mono tracking-[0.2em] text-primary uppercase mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Generate with AI
                            </label>
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="Describe your hero... e.g. 'A grumpy dwarven priest who worships the god of forge'."
                                className="w-full bg-input/50 border border-border rounded-lg px-4 py-3 font-serif text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <button
                            onClick={generateWithAI}
                            disabled={isGenerating || !aiPrompt.trim()}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground border-transparent rounded-lg font-bold font-mono tracking-widest uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                            {isGenerating ? 'Weaving Spell...' : 'Generate Profile'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* LEFT COLUMN: Choices */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Core Details (Name, Alignment, Background) */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>

                            <div>
                                <label className="block text-xs font-mono tracking-[0.2em] text-primary uppercase mb-2">Hero Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter a legendary name..."
                                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-2xl font-serif text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                                    maxLength={32}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono tracking-[0.2em] text-primary uppercase mb-2">Alignment</label>
                                    <select
                                        value={alignment}
                                        onChange={e => setAlignment(e.target.value)}
                                        className="w-full bg-input border border-border rounded-lg px-4 py-3 font-serif text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        <option value="Lawful">Lawful</option>
                                        <option value="Neutral">Neutral</option>
                                        <option value="Chaotic">Chaotic</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono tracking-[0.2em] text-primary uppercase mb-2">Background Origin</label>
                                <textarea
                                    value={background}
                                    onChange={e => setBackground(e.target.value)}
                                    placeholder="Where did this hero come from?"
                                    className="w-full bg-input border border-border rounded-lg px-4 py-3 font-serif text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors h-24 resize-none custom-scrollbar"
                                />
                            </div>
                        </div>

                        {/* Ancestry Selection */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-6 text-foreground">Ancestry</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {(Object.values(Ancestry) as Ancestry[]).map((anc) => (
                                    <button
                                        key={anc}
                                        onClick={() => setSelectedAncestry(anc)}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${selectedAncestry === anc ? 'bg-primary text-primary-foreground border-transparent shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'}`}
                                    >
                                        {ANCESTRIES[anc].name}
                                    </button>
                                ))}
                            </div>

                            {/* Selected Ancestry Details */}
                            <div className="bg-secondary/20 border border-border rounded-lg p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-foreground">{ANCESTRIES[selectedAncestry].name}</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-primary/20 text-primary border border-primary/30">
                                        Trait: {ANCESTRIES[selectedAncestry].feature}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                    {ANCESTRIES[selectedAncestry].description}
                                </p>
                                <div className="text-xs font-mono text-muted-foreground">
                                    <span className="text-muted-foreground">LANGUAGES:</span> {ANCESTRIES[selectedAncestry].languages.join(', ')}
                                </div>
                            </div>
                        </div>

                        {/* Class Selection */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-6 text-foreground">Class</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {(Object.values(HeroClass) as HeroClass[]).map((hc) => (
                                    <button
                                        key={hc}
                                        onClick={() => setSelectedClass(hc)}
                                        className={`flex flex-col items-center justify-center py-6 rounded-xl border transition-all ${selectedClass === hc ? 'bg-primary text-primary-foreground border-transparent shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'}`}
                                    >
                                        <span className="text-lg font-bold mb-1">{hc}</span>
                                        <span className="text-xs font-mono text-current opacity-80 text-center px-2 mt-1">
                                            {hc === 'Fighter' ? 'd8 HP • Any Weapon' : hc === 'Priest' ? 'd6 HP • Divine Magic' : hc === 'Thief' ? 'd4 HP • Stealth & Finesse' : 'd4 HP • Arcane Magic'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Stats & Action */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Stats Panel */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Attributes</h2>
                                    <p className="text-xs text-muted-foreground mt-1">Roll or customize manual attributes</p>
                                </div>
                                <div className={`px-4 py-2 rounded-lg border text-xs font-mono tracking-widest uppercase shadow-inner flex items-center gap-2 ${availablePoints > 0 ? 'bg-primary/20 border-primary/50 text-primary' : availablePoints < 0 ? 'bg-destructive/20 border-destructive/50 text-destructive' : 'bg-muted/50 border-border text-muted-foreground'}`}>
                                    <Sparkles className="w-4 h-4" />
                                    {availablePoints > 0 ? `${availablePoints} Pts Available` : availablePoints < 0 ? `Over budget: ${Math.abs(availablePoints)}` : 'Points Assigned'}
                                </div>
                            </div>

                            <div className="space-y-1 bg-secondary/20 p-4 rounded-xl border border-border">
                                <StatRow label="STR" value={stats.str} min={limits.str.min} max={limits.str.max} availablePoints={availablePoints} onChange={(v) => handleStatChange('str', v)} />
                                <StatRow label="DEX" value={stats.dex} min={limits.dex.min} max={limits.dex.max} availablePoints={availablePoints} onChange={(v) => handleStatChange('dex', v)} />
                                <StatRow label="CON" value={stats.con} min={limits.con.min} max={limits.con.max} availablePoints={availablePoints} onChange={(v) => handleStatChange('con', v)} />
                                <StatRow label="INT" value={stats.int} min={limits.int.min} max={limits.int.max} availablePoints={availablePoints} onChange={(v) => handleStatChange('int', v)} />
                                <StatRow label="WIS" value={stats.wis} min={limits.wis.min} max={limits.wis.max} availablePoints={availablePoints} onChange={(v) => handleStatChange('wis', v)} />
                                <StatRow label="CHA" value={stats.cha} min={limits.cha.min} max={limits.cha.max} availablePoints={availablePoints} onChange={(v) => handleStatChange('cha', v)} />
                            </div>
                        </div>

                        {/* Summary Block */}
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
                            <h3 className="text-sm font-mono tracking-widest text-primary uppercase mb-4 text-center">Hero Summary</h3>

                            <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
                                <div>
                                    <div className="text-3xl font-bold text-foreground mb-1">{name || 'Unnamed'}</div>
                                    <div className="text-muted-foreground text-sm">Level 1 {alignment} {selectedAncestry} {selectedClass}</div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || availablePoints !== 0 || !name.trim()}
                                className="w-full relative group perspective-1000 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-60 group-hover:opacity-100 transition duration-500 blur-md"></div>
                                <div className="relative bg-card border border-primary/50 text-foreground py-4 flex items-center justify-center gap-3 transition-transform duration-300 group-hover:scale-[0.98] group-active:scale-95 shadow-inner">
                                    <Save className="w-5 h-5 text-primary" />
                                    <span className="font-bold font-mono tracking-widest text-foreground uppercase">
                                        {isSaving ? 'Forging...' : 'Enter the Dungeon'}
                                    </span>
                                </div>
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
