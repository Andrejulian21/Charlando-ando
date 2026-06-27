import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import Icon from '../ui/Icon';

const MAX_LENGTH = 4000;

export default function ChatComposer({ actionUrl, room, placeholder = 'Mensaje' }) {
    const [value, setValue] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [focused, setFocused] = useState(false);
    const taRef = useRef(null);
    const addMessage = useChatStore((s) => s.addMessage);

    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }, [value]);

    useEffect(() => {
        if (!sending) taRef.current?.focus();
    }, [sending]);

    const send = async () => {
        const content = value.trim();
        if (!content) return;
        setSending(true);
        setError(null);
        try {
            const res = await window.axios.post(actionUrl, { content });
            if (res.data?.data) addMessage({ ...res.data.data, room });
            setValue('');
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
            taRef.current?.focus();
        }
    };

    return (
        <div className="border-t border-border/50 bg-surface-base/30 px-4 py-3">
            <form
                onSubmit={(e) => { e.preventDefault(); if (!sending && value.trim()) send(); }}
                className={`glass-heavy mx-auto w-full rounded-[2rem] shadow-2xl shadow-black/30 transition-all duration-300 [transition-timing-function:var(--spring-standard)] ${focused ? 'max-w-4xl' : 'max-w-3xl'}`}
            >
                <div className="flex items-end gap-2 px-4 py-3">
                    <textarea
                        ref={taRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!sending && value.trim()) send();
                            }
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        rows={1}
                        disabled={sending}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-fg-primary placeholder-fg-tertiary focus:outline-none disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={sending || !value.trim()}
                        aria-label="Enviar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary transition-all duration-200 [transition-timing-function:var(--spring-standard)] hover:bg-primary/30 active:scale-[0.92] disabled:opacity-30"
                    >
                        <Icon name="Send" size={16} />
                    </button>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-1.5 text-[10px] text-fg-tertiary">
                    <span>
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px]">Enter</kbd> enviar ·{' '}
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[9px]">Shift+Enter</kbd> nueva línea
                    </span>
                    <span>{value.length} / {MAX_LENGTH}</span>
                </div>
            </form>
            {error && <p role="alert" className="mx-auto mt-2 max-w-3xl text-xs text-danger">{error}</p>}
        </div>
    );
}