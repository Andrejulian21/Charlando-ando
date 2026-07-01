import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import Skeleton from '../ui/Skeleton';
import { useChatStore } from '../../stores/useChatStore';

function formatDateTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '';
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dateStr} ${time}`;
}

export default function MessageList({ room, initialMessages = [], initialCursor = null, fetchUrl, serverId, members = [] }) {
    const page = usePage();
    const currentUserId = page.props?.auth?.user?.id;

    const resolvedFetchUrl = useMemo(() => {
        if (fetchUrl) return fetchUrl;
        if (serverId != null) return `/api/servers/${serverId}/messages`;
        return null;
    }, [fetchUrl, serverId]);

    const storeMessages = useChatStore((s) => s.messages.get(room)) ?? [];
    const setMessages = useChatStore((s) => s.setMessages);
    const prependMessages = useChatStore((s) => s.prependMessages);
    const hydrating = useRef(true);

    const memberLookup = useMemo(() => {
        const map = new Map();
        for (const m of members ?? []) map.set(m.id, m);
        return map;
    }, [members]);

    const subscribeToRoom = useChatStore((s) => s.subscribeToRoom);
    const unsubscribeFromRoom = useChatStore((s) => s.unsubscribeFromRoom);

    // Subscribe to the correct Socket.io room for real-time message delivery.
    // Server publishes to "channel:{id}" or "dm:{id}" — derive from the room prop.
    useEffect(() => {
        if (!room) return;
        // room is "server:{serverId}:{channelId}" -> socket room is "channel:{channelId}"
        // room is "dm:{dmId}" -> socket room is "dm:{dmId}"
        const parts = room.split(':');
        let socketRoom;
        if (parts[0] === 'server' && parts[2]) {
            socketRoom = `channel:${parts[2]}`;
        } else if (parts[0] === 'dm') {
            socketRoom = room;
        } else {
            return; // unknown format, no subscription
        }
        const unsub = subscribeToRoom(socketRoom);
        return () => {
            try { unsub(); } catch { /* ignore */ }
        };
    }, [room, subscribeToRoom, unsubscribeFromRoom]);

    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialCursor != null);
    const [cursor, setCursor] = useState(initialCursor);
    const [error, setError] = useState(null);
    const topSentinelRef = useRef(null);
    const scrollerRef = useRef(null);
    const lastHeight = useRef(0);

    useEffect(() => {
        if (!room) return;
        setMessages(room, Array.isArray(initialMessages) ? initialMessages : []);
        hydrating.current = false;
        setHasMore(initialCursor != null);
        setCursor(initialCursor ?? null);
        setError(null);
    }, [room, initialMessages, setMessages, initialCursor]);

    useEffect(() => {
        const sentinel = topSentinelRef.current;
        const scroller = scrollerRef.current;
        if (!sentinel || !scroller || !hasMore || cursor == null || !resolvedFetchUrl) return;

        const observer = new IntersectionObserver(
            async (entries) => {
                if (!entries[0]?.isIntersecting || loadingMore) return;
                setLoadingMore(true);
                lastHeight.current = scroller.scrollHeight;
                try {
                    const res = await window.axios.get(resolvedFetchUrl, { params: { cursor } });
                    const data = res.data?.data ?? [];
                    prependMessages(room, data);
                    setCursor(res.data?.next_cursor ?? null);
                    if (!res.data?.next_cursor) setHasMore(false);
                    setError(null);
                } catch (err) {
                    setError(err?.response?.data?.message ?? 'Error al cargar mensajes.');
                } finally {
                    setLoadingMore(false);
                }
            },
            { root: scroller, rootMargin: '200px 0px 0px 0px', threshold: 0 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [cursor, hasMore, loadingMore, prependMessages, room, resolvedFetchUrl]);

    useLayoutEffect(() => {
        if (loadingMore) return;
        const scroller = scrollerRef.current;
        if (!scroller) return;
        if (lastHeight.current > 0) {
            scroller.scrollTop = scroller.scrollTop + (scroller.scrollHeight - lastHeight.current);
            lastHeight.current = 0;
        }
    }, [storeMessages.length, loadingMore]);

    const displayMessages = storeMessages.length > 0 ? storeMessages : initialMessages;

    return (
        <div ref={scrollerRef} className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0B0B12' }}>
            <div ref={topSentinelRef} aria-hidden="true" className="h-2" />

            {error && <p className="px-4 py-2 text-center text-xs text-danger">{error}</p>}
            {loadingMore && <div className="px-4 py-2"><Skeleton variant="text" count={3} /></div>}

            <div style={{ padding: '16px' }}>
                {displayMessages.length === 0 && !loadingMore && (
                    <p className="text-sm text-fg-muted text-center py-8">Aún no hay mensajes. Sé el primero en saludar.</p>
                )}

                <div className="space-y-1">
                    {displayMessages.map((msg) => {
                        const author = memberLookup.get(msg.user_id) ?? { id: msg.user_id, name: 'Desconocido', display_name: null };
                        const mine = Number(msg.user_id) === Number(currentUserId);

                        return (
                            <div key={msg.id} className="flex gap-3 px-2 py-1 mt-3">
                                <div className="w-10 shrink-0">
                                    <UserAvatar user={author} size="sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`truncate text-sm font-semibold ${mine ? 'text-primary' : 'text-fg'}`}>
                                            {author.display_name || author.name}
                                        </span>
                                        <time className="text-[11px] text-fg-subtle whitespace-nowrap">
                                            {formatDateTime(msg.created_at)}
                                        </time>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words text-sm text-fg">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
