// Virtualised-feel message list with cursor-paginated history.
//
// Layout:
//   - A `top-sentinel` sits above the first message. When it intersects
//     the viewport we fetch the next older page from the API and prepend
//     it to the store. We preserve the user's scroll position by capturing
//     scrollHeight before/after the prepend.
//   - A `bottom-anchor` sits below the last message. New WebSocket
//     messages extend the list naturally; if the user is near the bottom
//     we auto-scroll to keep them in view.
//   - The list itself scrolls inside a flex-1 parent.
//
// The store keeps messages in ASC order (oldest first), so we can render
// them in document order without reversing.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import { useChatStore } from '../../stores/useChatStore';

const PAGE_SIZE_HINT = 50;
const NEAR_BOTTOM_PX = 80;

function formatTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function authorFor(message, memberLookup) {
    if (message.user) return message.user;
    const member = memberLookup.get(message.user_id);
    if (!member) {
        return { id: message.user_id, name: 'Unknown', display_name: null, avatar_url: null };
    }
    return member;
}

function shouldGroupWith(prev, curr) {
    if (!prev || !curr) return false;
    if (prev.user_id !== curr.user_id) return false;
    // Group messages within a 5-minute window.
    const prevT = new Date(prev.created_at).valueOf();
    const currT = new Date(curr.created_at).valueOf();
    if (Number.isNaN(prevT) || Number.isNaN(currT)) return false;
    return currT - prevT < 5 * 60_000;
}

export default function MessageList({ room, initialMessages, initialCursor, serverId, channelId, members = [] }) {
    const messages = useChatStore((s) => s.messages.get(room)) ?? [];
    const setMessages = useChatStore((s) => s.setMessages);
    const prependMessages = useChatStore((s) => s.prependMessages);
    const subscribeToRoom = useChatStore((s) => s.subscribeToRoom);
    const unsubscribeFromRoom = useChatStore((s) => s.unsubscribeFromRoom);

    const scrollerRef = useRef(null);
    const topSentinelRef = useRef(null);
    const bottomAnchorRef = useRef(null);
    const lastPrewpendHeight = useRef(0);
    const hydratingRef = useRef(true);
    const page = usePage();
    const currentUserId = page.props?.auth?.user?.id;

    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialCursor != null);
    const [cursor, setCursor] = useState(initialCursor);
    const [error, setError] = useState(null);

    const memberLookup = useMemo(() => {
        const map = new Map();
        for (const m of members ?? []) map.set(m.id, m);
        return map;
    }, [members]);

    // Hydrate the store with the SSR-rendered first page. We do this
    // exactly once per (room, initialMessages) pair so that subsequent
    // WebSocket appends are not clobbered.
    useEffect(() => {
        if (!room) return;
        if (!Array.isArray(initialMessages) || initialMessages.length === 0) {
            setMessages(room, []);
            hydratingRef.current = false;
            return;
        }
        setMessages(room, initialMessages);
        hydratingRef.current = false;
    }, [room, initialMessages, setMessages]);

    // Subscribe to the room for live message:new events.
    useEffect(() => {
        if (!room) return undefined;
        const unsubscribe = subscribeToRoom(room);
        return unsubscribe;
    }, [room, subscribeToRoom]);

    // Auto-scroll to bottom on first render so the user lands on the
    // most recent message. We do this with useLayoutEffect to avoid a
    // visible jump.
    useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        if (hydratingRef.current) {
            scroller.scrollTop = scroller.scrollHeight;
        }
    }, [messages.length === 0]);

    // Watch for new messages and auto-scroll only if the user was already
    // near the bottom — otherwise we leave them where they are.
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        if (hydratingRef.current) return;
        const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        if (distanceFromBottom <= NEAR_BOTTOM_PX) {
            scroller.scrollTop = scroller.scrollHeight;
        }
    }, [messages.length]);

    // When the room changes (user navigates between channels) we want to
    // discard the previous scroll restoration. Reset bookkeeping.
    useEffect(() => {
        lastPrewpendHeight.current = 0;
        hydratingRef.current = true;
        setHasMore(initialCursor != null);
        setCursor(initialCursor ?? null);
        setError(null);
    }, [room, initialCursor]);

    // IntersectionObserver: top sentinel triggers a fetch of older pages.
    useEffect(() => {
        const sentinel = topSentinelRef.current;
        const scroller = scrollerRef.current;
        if (!sentinel || !scroller || !hasMore || cursor == null) return undefined;

        const observer = new IntersectionObserver(
            async (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting) return;
                if (loadingMore) return;

                setLoadingMore(true);
                lastPrewpendHeight.current = scroller.scrollHeight;
                try {
                    const response = await window.axios.get(
                        `/api/servers/${serverId}/channels/${channelId}/messages`,
                        { params: { cursor } }
                    );
                    const data = response.data?.data ?? [];
                    const nextCursor = response.data?.next_cursor ?? null;
                    prependMessages(room, data);
                    setCursor(nextCursor);
                    if (nextCursor == null) setHasMore(false);
                    setError(null);
                } catch (err) {
                    setError(err?.response?.data?.message ?? 'Failed to load older messages.');
                } finally {
                    setLoadingMore(false);
                }
            },
            { root: scroller, rootMargin: '200px 0px 0px 0px', threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [cursor, hasMore, loadingMore, prependMessages, room, serverId, channelId]);

    // After prepending older messages, restore the user's scroll position
    // by offsetting the new scrollHeight against the captured one.
    useLayoutEffect(() => {
        if (loadingMore) return;
        const scroller = scrollerRef.current;
        if (!scroller) return;
        if (lastPrewpendHeight.current > 0) {
            const delta = scroller.scrollHeight - lastPrewpendHeight.current;
            scroller.scrollTop = scroller.scrollTop + delta;
            lastPrewpendHeight.current = 0;
        }
    }, [messages.length, loadingMore]);

    if (!room) return null;

    return (
        <div
            ref={scrollerRef}
            className="flex-1 overflow-y-auto bg-deep-space-900"
            data-testid="message-scroller"
        >
            <div ref={topSentinelRef} aria-hidden="true" className="h-2" />

            {loadingMore && (
                <p className="px-4 py-2 text-center text-xs text-fg-subtle">Loading older messages…</p>
            )}
            {error && (
                <p className="px-4 py-2 text-center text-xs text-danger" role="alert">{error}</p>
            )}
            {!hasMore && messages.length > 0 && (
                <p className="px-4 py-2 text-center text-[10px] uppercase tracking-wider text-fg-subtle">
                    Beginning of #{channelId ?? 'channel'}
                </p>
            )}

            <ol className="px-4 py-3">
                {messages.length === 0 && !loadingMore && (
                    <li className="rounded-card border border-dashed border-deep-space-600 bg-deep-space-800/50 px-4 py-8 text-center text-sm text-fg-muted">
                        No messages yet. Be the first to say hi.
                    </li>
                )}

                {messages.map((message, index) => {
                    const prev = messages[index - 1];
                    const grouped = shouldGroupWith(prev, message);
                    const author = authorFor(message, memberLookup);
                    const mine = Number(message.user_id) === Number(currentUserId);
                    return (
                        <MessageRow
                            key={message.id}
                            message={message}
                            author={author}
                            grouped={grouped}
                            mine={mine}
                        />
                    );
                })}
            </ol>

            <div ref={bottomAnchorRef} aria-hidden="true" className="h-1" />
        </div>
    );
}

function MessageRow({ message, author, grouped, mine }) {
    return (
        <li className={`flex gap-3 px-2 py-1 hover:bg-deep-space-800/60 ${grouped ? 'mt-0.5' : 'mt-3'}`}>
            <div className="w-10 shrink-0">
                {!grouped && <UserAvatar user={author} size="sm" />}
            </div>
            <div className="min-w-0 flex-1">
                {!grouped && (
                    <div className="flex items-baseline gap-2">
                        <span className={`truncate text-sm font-semibold ${mine ? 'text-primary' : 'text-fg'}`}>
                            {author.display_name || author.name}
                        </span>
                        <time className="text-[11px] text-fg-subtle" dateTime={message.created_at}>
                            {formatTime(message.created_at)}
                        </time>
                        {message.edited_at && (
                            <span className="text-[10px] text-fg-subtle" title={`Edited ${formatTime(message.edited_at)}`}>
                                (edited)
                            </span>
                        )}
                    </div>
                )}
                <p className="whitespace-pre-wrap break-words text-sm text-fg">
                    {message.content}
                </p>
            </div>
        </li>
    );
}
