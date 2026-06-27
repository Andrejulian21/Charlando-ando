import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../../stores/useChatStore';

// Create a fresh store instance for each test to avoid state leakage
function createStore() {
    return useChatStore.getState();
}

describe('useChatStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useChatStore.setState({
            messages: new Map(),
            channels: new Map(),
            presence: new Map(),
            currentServer: null,
            currentChannel: null,
            currentUser: null,
            socketConnected: false,
            _roomListeners: new Map(),
        });
    });

    it('should set and get currentUser', () => {
        const store = createStore();
        const user = { id: 1, name: 'Test User', email: 'test@example.com' };

        store.setCurrentUser(user);
        expect(useChatStore.getState().currentUser).toEqual(user);

        store.setCurrentUser(null);
        expect(useChatStore.getState().currentUser).toBeNull();
    });

    it('should set and get currentChannel', () => {
        const store = createStore();
        const channel = { id: 5, name: 'general', type: 'text' };

        store.setCurrentChannel(channel);
        expect(useChatStore.getState().currentChannel).toEqual(channel);
    });

    it('should set and get currentServer', () => {
        const store = createStore();
        const server = { id: 2, name: 'My Server' };

        store.setCurrentServer(server);
        expect(useChatStore.getState().currentServer).toEqual(server);
    });

    it('should add messages to a room', () => {
        const store = createStore();
        const message = { id: 100, room: 'channel:1', content: 'Hello world' };

        store.addMessage(message);
        const messages = useChatStore.getState().messages.get('channel:1');
        expect(messages).toHaveLength(1);
        expect(messages[0].id).toBe(100);
    });

    it('should not add duplicate messages by id', () => {
        const store = createStore();
        const message = { id: 100, room: 'channel:1', content: 'Hello' };

        store.addMessage(message);
        store.addMessage(message);
        const messages = useChatStore.getState().messages.get('channel:1');
        expect(messages).toHaveLength(1);
    });

    it('should set and clear messages for a room', () => {
        const store = createStore();
        const room = 'dm:3';

        store.setMessages(room, [
            { id: 1, content: 'First' },
            { id: 2, content: 'Second' },
        ]);
        expect(useChatStore.getState().messages.get(room)).toHaveLength(2);

        store.setMessages(room, []);
        expect(useChatStore.getState().messages.get(room)).toHaveLength(0);
    });

    it('should set presence for a user', () => {
        const store = createStore();

        store.setPresence(42, 'online');
        const record = useChatStore.getState().presence.get(42);
        expect(record.status).toBe('online');
        expect(record.lastSeen).toBeNull();
    });

    it('should set presence for a user with lastSeen timestamp', () => {
        const store = createStore();
        const ts = '2026-01-01T12:00:00Z';

        store.setPresence(42, 'offline', ts);
        const record = useChatStore.getState().presence.get(42);
        expect(record.status).toBe('offline');
        expect(record.lastSeen).toBe(ts);
    });

    it('should set multiple presence entries via setPresenceBatch', () => {
        const store = createStore();
        const rows = [
            { user_id: 10, status: 'online', last_seen_at: null },
            { user_id: 20, status: 'idle', last_seen_at: null },
            { user_id: 30, status: 'dnd', last_seen_at: null },
        ];

        store.setPresenceBatch(rows);
        expect(useChatStore.getState().presence.get(10).status).toBe('online');
        expect(useChatStore.getState().presence.get(20).status).toBe('idle');
        expect(useChatStore.getState().presence.get(30).status).toBe('dnd');
    });

    it('should set channels for a server', () => {
        const store = createStore();
        const channels = [
            { id: 1, name: 'general' },
            { id: 2, name: 'random' },
        ];

        store.setChannels(5, channels);
        const stored = useChatStore.getState().channels.get(5);
        expect(stored).toHaveLength(2);
        expect(stored[0].name).toBe('general');
    });
});
