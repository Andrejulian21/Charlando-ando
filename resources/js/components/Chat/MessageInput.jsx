// Bottom-of-channel composer. Sends messages via the REST endpoint and
// does NOT render optimistically — the WebSocket broadcast is the source
// of truth and will populate the list shortly. Shift+Enter inserts a
// newline; Enter alone submits.

import { useEffect, useRef, useState } from 'react';

const MAX_LENGTH = 4000;

export default function MessageInput({ serverId, channelId, disabled = false }) {
    const [value, setValue] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);

    // Auto-grow the textarea as the user types up to a soft cap.
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }, [value]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!sending && value.trim().length > 0) {
                send();
            }
        }
    };

    const send = async () => {
        const content = value.trim();
        if (!content) return;
        setSending(true);
        setError(null);
        try {
            await window.axios.post(
                `/api/servers/${serverId}/channels/${channelId}/messages`,
                { content }
            );
            setValue('');
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!sending && value.trim().length > 0) send();
            }}
            className="border-t border-deep-space-700 bg-deep-space-800 p-4"
        >
            <div className="rounded-card border border-deep-space-600 bg-deep-space-700 transition-colors focus-within:border-primary">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={disabled || sending}
                    placeholder={disabled ? 'Conectando…' : `Mensaje en #${channelId}`}
                    aria-label="Mensaje"
                    className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-fg placeholder-fg-subtle focus:outline-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between border-t border-deep-space-600 px-3 py-1.5 text-[11px] text-fg-subtle">
                    <span>
                        <kbd className="rounded bg-deep-space-600 px-1.5 py-0.5 text-[10px]">Enter</kbd> para enviar ·{' '}
                        <kbd className="rounded bg-deep-space-600 px-1.5 py-0.5 text-[10px]">Shift+Enter</kbd> nueva línea
                    </span>
                    <span>{value.length} / {MAX_LENGTH}</span>
                </div>
            </div>

            {error && (
                <p role="alert" className="mt-2 text-xs text-danger">{error}</p>
            )}

            <input type="submit" hidden />
        </form>
    );
}
