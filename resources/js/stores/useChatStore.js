// Centralised chat state used by every chat surface (channels, DMs, member
// list, presence badges). The store owns:
//
//   - messages      keyed by room id (e.g. "channel:42" or "dm:7")
//   - channels      keyed by server id so Chat/Index can iterate without a
//                   second fetch
//   - presence      keyed by user id — { status, lastSeen }
//   - selection     currentServer / currentChannel / currentUser
//
// Components subscribe to slices via Zustand selectors so unrelated updates
// do not re-render the whole tree. The store is also the place where we
// own the socket.io connection lifecycle — `connectSocket` wires the
// listeners that dispatch `addMessage` / `setPresence` actions.

import { create } from 'zustand';
import { useEffect } from 'react';
import { subscribe as echoSubscribe, unsubscribe as echoUnsubscribe, connect, disconnect } from '../echo';

const TOKEN_STORAGE_KEY = 'auth_token';

function getToken() {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

function readCurrentUser() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem('current_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function persistCurrentUser(user) {
    if (typeof window === 'undefined') return;
    try {
        if (user) {
            window.localStorage.setItem('current_user', JSON.stringify(user));
        } else {
            window.localStorage.removeItem('current_user');
        }
    } catch {
        // Storage may be unavailable (private mode); silently ignore.
    }
}

export const useChatStore = create((set, get) => ({
    // --- state ---
    messages: new Map(),
    channels: new Map(),
    presence: new Map(),
    currentServer: null,
    currentChannel: null,
    currentUser: readCurrentUser(),
    socketConnected: false,

    // --- internal: room listeners -----------------------------------------
    // Map<room, { event: unsubscribe }> — tracks active socket.io listeners
    // so that we can clean them up on disconnect or when leaving a room.
    _roomListeners: new Map(),

    // --- actions ---------------------------------------------------------

    /**
     * Append a single message to the room it belongs to. Used both by the
     * WebSocket listener and (occasionally) by initial page loads that
     * hydrate a channel's tail via the Inertia props.
     *
     * Messages are stored in ASC order (oldest first, newest last) so the
     * UI can render them in document order without reversing. New messages
     * therefore go to the end of the array.
     */
    addMessage: (message) => {
        if (!message || !message.room) return;
        const { messages } = get();
        const list = messages.get(message.room) ?? [];
        // De-duplicate by id — the broadcast can race the HTTP response for
        // the author's own message.
        if (list.some((m) => m.id === message.id)) return;
        const next = new Map(messages);
        next.set(message.room, [...list, message]);
        set({ messages: next });
    },

    /**
     * Hydrate a full page of older messages at the top of the room. The
     * server returns messages in DESC order (newest first) within a page;
     * we reverse to ASC so the merged list stays in chronological order.
     * Used by MessageList when the IntersectionObserver fires.
     */
    prependMessages: (room, page) => {
        if (!room || !Array.isArray(page) || page.length === 0) return;
        const { messages } = get();
        const existing = messages.get(room) ?? [];
        const existingIds = new Set(existing.map((m) => m.id));
        // Reverse the page (server returns DESC) and filter duplicates.
        const freshAsc = page
            .slice()
            .reverse()
            .filter((m) => !existingIds.has(m.id));
        if (freshAsc.length === 0) return;
        const next = new Map(messages);
        // Older messages go to the start of the ASC list.
        next.set(room, [...freshAsc, ...existing]);
        set({ messages: next });
    },

    /**
     * Replace the messages for a room outright. Useful for initial hydration
     * from Inertia props where we want to discard whatever the store
     * already had and use the server-rendered snapshot.
     */
    setMessages: (room, list) => {
        if (!room) return;
        const next = new Map(get().messages);
        const asc = Array.isArray(list) ? list.slice().reverse() : [];
        next.set(room, asc);
        set({ messages: next });
    },

    setChannels: (serverId, channels) => {
        const { channels: existing } = get();
        const next = new Map(existing);
        next.set(serverId, Array.isArray(channels) ? channels : []);
        set({ channels: next });
    },

    setCurrentServer: (server) => set({ currentServer: server }),
    setCurrentChannel: (channel) => set({ currentChannel: channel }),

    setCurrentUser: (user) => {
        persistCurrentUser(user);
        set({ currentUser: user });
    },

    /**
     * Update presence for a single user. The `lastSeen` is only meaningful
     * for the `offline` transition — for online/idle/dnd it is null.
     */
    setPresence: (userId, status, lastSeen = null) => {
        if (userId == null) return;
        const { presence } = get();
        const next = new Map(presence);
        next.set(userId, { status, lastSeen });
        set({ presence: next });
    },

    /**
     * Hydrate a batch of presence rows (e.g. the member list on page load).
     * Accepts an array of { user_id, status, last_seen_at }.
     */
    setPresenceBatch: (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const { presence } = get();
        const next = new Map(presence);
        for (const row of rows) {
            if (row?.user_id == null) continue;
            next.set(row.user_id, {
                status: row.status ?? 'offline',
                lastSeen: row.last_seen_at ?? null,
            });
        }
        set({ presence: next });
    },

    /**
     * Open the socket.io connection, wire `message:new` and `presence:update`
     * listeners for the rooms we currently care about, and replay on
     * reconnect. Idempotent — safe to call from multiple components.
     */
    connectSocket: () => {
        if (!getToken()) return null;
        const socket = connect();
        set({ socketConnected: socket.connected });

        // Wire a connection-state observer so consumers can reflect the
        // "connecting / disconnected" pill in the UI.
        socket.on('connect', () => set({ socketConnected: true }));
        socket.on('disconnect', () => set({ socketConnected: false }));

        // Replay any rooms the store has been told to listen on.
        for (const room of get()._listenedRooms()) {
            get()._listenToRoom(room);
        }

        return socket;
    },

    /**
     * Tear down the socket. We do NOT clear the message cache here — chat
     * history should survive a logout from a single tab, and the next
     * login can rebuild it from the API.
     */
    disconnectSocket: () => {
        for (const { unsubscribe } of get()._roomListeners.values()) {
            try {
                unsubscribe();
            } catch {
                /* ignore */
            }
        }
        disconnect();
        set({ socketConnected: false, _roomListeners: new Map() });
    },

    /**
     * Subscribe to events on a single room. Returns an unsubscribe function
     * for the consumer to call on unmount.
     */
    subscribeToRoom: (room) => {
        return get()._listenToRoom(room);
    },

    unsubscribeFromRoom: (room) => {
        const listeners = get()._roomListeners.get(room);
        if (!listeners) return;
        try {
            listeners.unsubscribe();
        } catch {
            /* ignore */
        }
        const next = new Map(get()._roomListeners);
        next.delete(room);
        set({ _roomListeners: next });
    },

    // --- internal helpers ------------------------------------------------

    _listenedRooms: () => Array.from(get()._roomListeners.keys()),

    _listenToRoom: (room) => {
        if (!room) return () => {};
        const { _roomListeners, addMessage, setPresence } = get();
        if (_roomListeners.has(room)) {
            return () => get().unsubscribeFromRoom(room);
        }

        const unsubs = [];
        if (room.startsWith('channel:') || room.startsWith('dm:') || room.startsWith('server:')) {
            unsubs.push(
                echoSubscribe(room, 'message:new', (payload) => {
                    if (payload && payload.id) {
                        addMessage({ ...payload, room });
                    }
                }),
            );
        }
        if (room.startsWith('user:')) {
            const userId = Number(room.slice('user:'.length));
            unsubs.push(
                echoSubscribe(room, 'presence:update', (payload) => {
                    if (payload && payload.userId != null) {
                        setPresence(payload.userId, payload.status, payload.at ?? null);
                    } else if (userId) {
                        // Fallback: payload shape is { user_id, status, at }
                        setPresence(payload?.user_id ?? userId, payload?.status, payload?.at ?? null);
                    }
                }),
            );
        }

        const unsubscribe = () => {
            for (const fn of unsubs) {
                try {
                    fn();
                } catch {
                    /* ignore */
                }
            }
        };

        const next = new Map(_roomListeners);
        next.set(room, { unsubscribe });
        set({ _roomListeners: next });

        return unsubscribe;
    },
}));

/**
 * Convenience hook that returns just the messages for a single room. The
 * selector returns a stable array reference until the room's list changes,
 * so consumers can pass it to React.memo / useMemo cheaply.
 */
export function useMessages(room) {
    return useChatStore((state) => (room ? state.messages.get(room) : undefined));
}

/**
 * Convenience hook that returns just the presence record for a single user.
 */
export function usePresence(userId) {
    return useChatStore((state) => (userId != null ? state.presence.get(userId) : undefined));
}

/**
 * Live presence hook. Subscribes to the user's `user:{id}` room on mount
 * so the WebSocket fan-out from the sidecar updates the store, and reads
 * the latest record on every render. Use this anywhere a user is rendered
 * to get real-time status changes without manual subscription wiring.
 */
export function useUserPresence(userId) {
    const subscribeToRoom = useChatStore((s) => s.subscribeToRoom);
    const presence = useChatStore((s) => (userId != null ? s.presence.get(userId) : undefined));

    useEffect(() => {
        if (userId == null) return undefined;
        return subscribeToRoom(`user:${userId}`);
    }, [userId, subscribeToRoom]);

    return presence;
}
