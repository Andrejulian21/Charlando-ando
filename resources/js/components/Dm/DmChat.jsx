// DM chat surface. Two-column layout: DmList on the left, MessageList +
// ChatComposer on the right.

import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import MessageList from '../Chat/MessageList';
import ChatComposer from '../Chat/ChatComposer';
import UserAvatar from '../Presence/UserAvatar';
import LastSeen from '../Presence/LastSeen';
import { useChatStore } from '../../stores/useChatStore';

export default function DmChat({ dm, otherUser = null, messages = [], nextCursor = null, currentUserId }) {
    const page = usePage();
    const currentUser = page.props?.auth?.user ?? null;

    // Use pre-computed otherUser from backend if available, otherwise fall back to resolving from dm.
    const other =
        otherUser ??
        (() => {
            if (!dm) return null;
            if (Number(dm?.user_a_id) === Number(currentUserId)) return dm?.user_b ?? dm?.userB ?? null;
            return dm?.user_a ?? dm?.userA ?? null;
        })();
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);
    const setPresence = useChatStore((s) => s.setPresence);
    const connectSocket = useChatStore((s) => s.connectSocket);

    const room = dm ? `dm:${dm.id}` : null;

    useEffect(() => {
        if (other?.id) {
            // Seed presence for the other user so the avatar's status dot
            // is correct before the first WebSocket tick arrives.
            setPresence(other.id, other?.status ?? 'offline');
        }
    }, [other, setPresence]);

    useEffect(() => {
        try {
            connectSocket?.();
        } catch (err) {
            console.error('[DmChat] connectSocket failed:', err);
        }
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
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-surface-base/50 px-4">
                <UserAvatar user={other} size="sm" />
                <div className="min-w-0 flex-1">
                    <h1 className="truncate font-display text-base font-semibold text-fg-primary">
                        {other?.display_name || other?.name}
                    </h1>
                    <p className="truncate text-xs text-fg-secondary">
                        @{other?.name} ·{' '}
                        <LastSeen
                            userId={other?.id}
                            fallbackStatus={other?.status}
                            lastSeenAt={other?.last_seen_at}
                            className="inline"
                        />
                    </p>
                </div>
            </header>

            <MessageList
                room={room}
                initialMessages={messages}
                initialCursor={nextCursor}
                fetchUrl={`/api/dms/${dm?.id}/messages`}
                channelId={dm?.id}
                members={[currentUser, other].filter(Boolean)}
            />

            <ChatComposer
                actionUrl={`/api/dms/${dm?.id}/messages`}
                room={room}
                placeholder="Mensaje"
            />
        </main>
    );
}