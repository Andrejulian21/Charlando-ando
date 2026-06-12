// DM chat surface. Two-column layout: DmList on the left, MessageList +
// MessageInput on the right. The composer for DMs is a thin wrapper that
// posts to /api/dms/{id}/messages instead of the channel endpoint.

import { useEffect, useRef, useState } from 'react';
import MessageList from '../Chat/MessageList';
import UserAvatar from '../Presence/UserAvatar';
import LastSeen from '../Presence/LastSeen';
import { useChatStore } from '../../stores/useChatStore';

function pickOther(dm, currentUserId) {
    if (!dm) return null;
    if (Number(dm.user_a_id) === Number(currentUserId)) return dm.userB ?? null;
    return dm.userA ?? null;
}

const MAX_LENGTH = 4000;

export default function DmChat({ dm, messages = [], nextCursor = null, currentUserId }) {
    const other = pickOther(dm, currentUserId);
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);
    const setPresence = useChatStore((s) => s.setPresence);
    const connectSocket = useChatStore((s) => s.connectSocket);
    const socketConnected = useChatStore((s) => s.socketConnected);
    const page = useChatStore.getState; // reserved for future use

    const room = dm ? `dm:${dm.id}` : null;

    useEffect(() => {
        if (other) {
            // Seed presence for the other user so the avatar's status dot
            // is correct before the first WebSocket tick arrives.
            setPresence(other.id, other.status ?? 'offline');
        }
    }, [other, setPresence]);

    useEffect(() => {
        connectSocket();
    }, [connectSocket]);

    if (!dm || !other) {
        return (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-muted">
                Elige una conversación para empezar a chatear.
            </div>
        );
    }

    return (
        <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-deep-space-700 bg-deep-space-800 px-4">
                <UserAvatar user={other} size="sm" />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate font-display text-base font-semibold text-fg">
                        {other.display_name || other.name}
                    </h1>
                    <p className="truncate text-xs text-fg-subtle">
                        @{other.name} ·{' '}
                        <LastSeen
                            userId={other.id}
                            fallbackStatus={other.status}
                            lastSeenAt={other.last_seen_at}
                            className="inline"
                        />
                    </p>
                </div>
            </header>

            <MessageList
                room={room}
                initialMessages={messages}
                initialCursor={nextCursor}
                fetchUrl={`/api/dms/${dm.id}/messages`}
                channelId={dm.id}
                members={[other].filter(Boolean)}
            />

            <DmComposer dmId={dm.id} disabled={!socketConnected} />
        </main>
    );
}

function DmComposer({ dmId, disabled }) {
    const [value, setValue] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const taRef = useRef(null);

    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    }, [value]);

    const send = async () => {
        const content = value.trim();
        if (!content) return;
        setSending(true);
        setError(null);
        try {
            await window.axios.post(`/api/dms/${dmId}/messages`, { content });
            setValue('');
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
            taRef.current?.focus();
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
                    ref={taRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!sending && value.trim().length > 0) send();
                        }
                    }}
                    rows={1}
                    disabled={disabled || sending}
                    placeholder={disabled ? 'Conectando…' : 'Mensaje'}
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
            {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
            <input type="submit" hidden />
        </form>
    );
}
