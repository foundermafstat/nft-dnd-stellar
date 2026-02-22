'use client';

import { useState, useRef, useEffect } from 'react';

interface DialogMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface NpcDialogProps {
    npcId: string;
    npcName: string;
    npcTitle?: string;
    onClose: () => void;
}

import { SERVER_URL } from '@/lib/config';


export default function NpcDialog({ npcId, npcName, npcTitle, onClose }: NpcDialogProps) {
    const [messages, setMessages] = useState<DialogMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: DialogMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${SERVER_URL}/api/npc/${npcId}/dialog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: [...messages, userMsg] }),
            });
            const data = await res.json();
            if (data.success && data.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: '*stares silently*' }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: '*turns away*' }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    }

    return (
        <div className="absolute right-0 top-0 bottom-0 z-50 w-80 flex flex-col bg-[#0a0806]/95 border-l border-amber-900/20 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20">
                <div>
                    <h3 className="text-amber-200 font-serif font-bold text-sm">{npcName}</h3>
                    {npcTitle && <p className="text-stone-500 text-[10px] font-serif">{npcTitle}</p>}
                </div>
                <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 transition-colors cursor-pointer"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                {messages.length === 0 && (
                    <p className="text-stone-600 text-xs font-serif italic text-center mt-8">
                        {npcName} regards you with interest...
                    </p>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] px-3 py-2 rounded-lg text-xs font-serif leading-relaxed ${msg.role === 'user'
                                ? 'bg-stone-800/50 text-stone-300 border border-stone-700/30'
                                : 'bg-amber-900/15 text-amber-200/90 border border-amber-800/20'
                                }`}
                        >
                            {msg.role === 'assistant' && (
                                <span className="text-amber-500/60 text-[10px] block mb-1">{npcName}</span>
                            )}
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-amber-900/15 border border-amber-800/20 rounded-lg px-3 py-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-amber-900/20">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Speak..."
                        className="flex-1 bg-stone-900/50 border border-stone-700/30 rounded-lg px-3 py-2 text-xs text-stone-300 font-serif placeholder:text-stone-600 focus:outline-none focus:border-amber-800/40 transition-colors"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-3 py-2 rounded-lg border border-amber-700/30 bg-gradient-to-b from-amber-800/20 to-amber-900/10 text-amber-300 text-xs font-serif
                                   hover:from-amber-700/30 hover:to-amber-800/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
