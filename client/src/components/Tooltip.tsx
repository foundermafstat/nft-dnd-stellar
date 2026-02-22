'use client';

interface TooltipProps {
    x: number;
    y: number;
    name: string;
    title?: string;
    level?: number;
    type: 'player' | 'npc';
}

export default function Tooltip({ x, y, name, title, level, type }: TooltipProps) {
    const borderColor = type === 'npc' ? 'border-amber-700/40' : 'border-sky-700/40';
    const accentColor = type === 'npc' ? 'text-amber-300' : 'text-sky-300';
    const dotColor = type === 'npc' ? 'bg-amber-500' : 'bg-sky-500';

    return (
        <div
            className="absolute z-40 pointer-events-none"
            style={{ left: x, top: y - 56, transform: 'translateX(-50%)' }}
        >
            <div className={`bg-[#0e0c09]/95 border ${borderColor} rounded-md px-3 py-1.5 shadow-xl backdrop-blur-sm`}>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span className={`${accentColor} text-xs font-serif font-bold whitespace-nowrap`}>{name}</span>
                </div>
                {(title || level) && (
                    <div className="text-[10px] text-stone-500 font-serif whitespace-nowrap">
                        {title && <span>{title}</span>}
                        {title && level && <span> · </span>}
                        {level && <span>Lv. {level}</span>}
                    </div>
                )}
            </div>
            {/* Arrow */}
            <div className={`w-2 h-2 bg-[#0e0c09]/95 border-r ${borderColor} border-b rotate-45 mx-auto -mt-1`} />
        </div>
    );
}
