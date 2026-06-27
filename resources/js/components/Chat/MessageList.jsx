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

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import Skeleton from '../ui/Skeleton';
import { useChatStore } from '../../stores/useChatStore';

const PAGE_SIZE_HINT = 50;
const NEAR_BOTTOM_PX = 80;

function formatTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '';
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dateStr} ${time}`;
}

function authorFor(message, memberLookup) {
    if (message.user) return message.user;
    const member = memberLookup.get(message.user_id);
    if (!member) {
        return { id: message.user_id, name: 'Desconocido', display_name: null, avatar_url: null };
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

export default function MessageList({
    room,
    initialMessages,
    initialCursor,
    serverId,
    channelId = null,
    fetchUrl,
    members = [],
}) {
    // Resolve the cursor-paginated URL once. Servers pass
    // serverId (used to build /api/servers/.../messages);
    // DMs pass an explicit `fetchUrl` like /api/dms/{id}/messages.
    const resolvedFetchUrl = useMemo(() => {
        if (fetchUrl) return fetchUrl;
        if (serverId != null) {
            return `/api/servers/${serverId}/messages`;
        }
        return null;
    }, [fetchUrl, serverId]);

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

    // Always scroll to bottom on new messages so the user sees what they sent.
    const messagesRef = useRef(messages);
    useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        if (hydratingRef.current) {
            scroller.scrollTop = scroller.scrollHeight;
            hydratingRef.current = false;
            return;
        }
        if (messagesRef.current === messages) return;
        messagesRef.current = messages;
        scroller.scrollTop = scroller.scrollHeight;
    });

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
        if (!sentinel || !scroller || !hasMore || cursor == null || !resolvedFetchUrl) return undefined;

        const observer = new IntersectionObserver(
            async (entries) => {
                const entry = entries[0];
                if (!entry?.isIntersecting) return;
                if (loadingMore) return;

                setLoadingMore(true);
                lastPrewpendHeight.current = scroller.scrollHeight;
                try {
                    const response = await window.axios.get(resolvedFetchUrl, { params: { cursor } });
                    const data = response.data?.data ?? [];
                    const nextCursor = response.data?.next_cursor ?? null;
                    prependMessages(room, data);
                    setCursor(nextCursor);
                    if (nextCursor == null) setHasMore(false);
                    setError(null);
                } catch (err) {
                    setError(err?.response?.data?.message ?? 'No se pudieron cargar los mensajes anteriores.');
                } finally {
                    setLoadingMore(false);
                }
            },
            { root: scroller, rootMargin: '200px 0px 0px 0px', threshold: 0 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [cursor, hasMore, loadingMore, prependMessages, room, resolvedFetchUrl]);

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
        <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-surface-base" data-testid="message-scroller">
            <div ref={topSentinelRef} aria-hidden="true" className="h-2" />

            {loadingMore && (
                <div className="px-4 py-2">
                    <Skeleton variant="text" count={3} />
                </div>
            )}
            {error && (
                <p className="px-4 py-2 text-center text-xs text-danger" role="alert">
                    {error}
                </p>
            )}
            {!hasMore && messages.length > 0 && (
                <p className="px-4 py-2 text-center text-[10px] uppercase tracking-wider text-fg-subtle">
                    Inicio de la conversación
                </p>
            )}

            <ol className="px-4 py-3">
                {messages.length === 0 && !loadingMore && (
                    <li className="rounded-card border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-fg-muted">
                        Aún no hay mensajes. Sé el primero en saludar.
                    </li>
                )}

                {messages.map((message, index) => {
                    const prev = messages[index - 1];
                    const grouped = shouldGroupWith(prev, message);
                    const author = authorFor(message, memberLookup);
                    const mine = Number(message.user_id) === Number(currentUserId);
                    const sameDay = prev && new Date(prev.created_at).toDateString() === new Date(message.created_at).toDateString();
                    return (
                        <span key={message.id}>
                            {!sameDay && prev && (
                                <li className="flex items-center gap-3 py-2" aria-hidden="true">
                                    <span className="h-px flex-1 bg-border" />
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-fg-tertiary whitespace-nowrap">
                                        {new Date(message.created_at).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="h-px flex-1 bg-border" />
                                </li>
                            )}
                            <MessageRow
                                message={message}
                                author={author}
                                grouped={grouped}
                                mine={mine}
                                index={index}
                                serverId={serverId}
                            />
                        </span>
                    );
                })}
            </ol>

            <div ref={bottomAnchorRef} aria-hidden="true" className="h-1" />
        </div>
    );
}

function MessageRow({ message, author, grouped, mine, index, serverId }) {
    return (
        <li
            style={{ '--index': index }}
            className={`flex gap-3 px-2 py-1 animate-[slide-up_300ms_var(--spring-gentle)_calc(var(--index)*30ms)_both] hover:glass transition-all duration-200 ${grouped ? 'mt-0.5' : 'mt-3'}`}
        >
            <div className="w-10 shrink-0">{!grouped && <UserAvatar user={author} size="sm" />}</div>
            <div className="min-w-0 flex-1">
                {!grouped && (
                    <div className="flex items-baseline gap-2">
                        <span className={`truncate text-sm font-semibold ${mine ? 'text-primary' : 'text-fg'}`}>
                            {author.display_name || author.name}
                        </span>
                        <time className="text-[11px] text-fg-subtle whitespace-nowrap" dateTime={message.created_at} title={new Date(message.created_at).toLocaleString()}>
                            {formatDateTime(message.created_at)}
                        </time>
                        {message.edited_at && (
                            <span
                                className="text-[10px] text-fg-subtle"
                                title={`Editado ${formatDateTime(message.edited_at)}`}
                            >
                                (editado)
                            </span>
                        )}
                    </div>
                )}
                {/* Invite card */}
                {(() => {
                    try {
                        const parsed = JSON.parse(message.content);
                        if (parsed.type === 'server_invite') {
                            return (
                                <div className="glass rounded-xl p-4 mt-1 space-y-2">
                                    <p className="text-sm font-medium text-fg-primary">
                                        <svg aria-hidden="true" viewBox="0 0 20 20" className="mr-1.5 inline-block h-4 w-4 fill-current text-primary"><path d="M10 1a7 7 0 0 0-7 7c0 2.1.9 3.9 2.5 5.2l-.4 2.7a.5.5 0 0 0 .8.5l2.5-1.8A7 7 0 1 0 10 1zM7 7h6a1 1 0 1 1 0 2H7a1 1 0 0 1 0-2zm0 3h4a1 1 0 1 1 0 2H7a1 1 0 0 1 0-2z"/></svg>
                                        Invitación a <span className="text-primary">{parsed.server_name}</span>
                                    </p>
                                    <p className="text-xs text-fg-tertiary">por {parsed.invited_by}</p>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await window.axios.post(`/api/servers/${parsed.server_id}/join`);
                                                    window.location.href = `/chat/${parsed.server_id}`;
                                                } catch (e) {
                                                    console.error('Error al aceptar invitación', e);
                                                }
                                            }}
                                            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
                                        >
                                            Aceptar
                                        </button>
                                        <button className="rounded-lg glass px-4 py-1.5 text-xs font-medium text-fg-secondary transition-all hover:text-fg-primary active:scale-[0.97]">
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    } catch {}
                    return null;
                })()}
                {(() => {
                    try { JSON.parse(message.content); return null; }
                    catch { return <p className="whitespace-pre-wrap break-words text-sm text-fg">{message.content}</p>; }
                })()}
            </div>
        </li>
    );
}
