// Per-channel chat surface. Pulls initial messages, members, and the
// active server out of Inertia props, hydrates the chat store, and lays
// out the four-column chat shell (server rail, channel list, messages,
// member list).

import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import ChannelList from '../../components/Chat/ChannelList';
import MemberList from '../../components/Chat/MemberList';
import ChatHeader from '../../components/Chat/ChatHeader';
import MessageList from '../../components/Chat/MessageList';
import MessageInput from '../../components/Chat/MessageInput';
import { useChatStore } from '../../stores/useChatStore';

export default function ChatShow({
    server,
    channel,
    messages = [],
    nextCursor = null,
    members = [],
    otherServers = [],
    auth,
}) {
    const setChannels = useChatStore((s) => s.setChannels);
    const setCurrentServer = useChatStore((s) => s.setCurrentServer);
    const setCurrentChannel = useChatStore((s) => s.setCurrentChannel);
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);
    const setPresenceBatch = useChatStore((s) => s.setPresenceBatch);
    const connectSocket = useChatStore((s) => s.connectSocket);
    const socketConnected = useChatStore((s) => s.socketConnected);

    const room = channel ? `channel:${channel.id}` : null;

    // Hydrate the store from the SSR payload once per page load.
    useEffect(() => {
        if (server) {
            setCurrentServer(server);
            setChannels(server.id, server.channels ?? []);
        }
        if (channel) setCurrentChannel(channel);
        if (auth?.user) setCurrentUser(auth.user);
    }, [server, channel, auth, setChannels, setCurrentServer, setCurrentChannel, setCurrentUser]);

    // Hydrate presence from the members list so the badges have something
    // to render before the first WebSocket tick arrives.
    useEffect(() => {
        if (!members || members.length === 0) return;
        setPresenceBatch(
            members.map((m) => ({
                user_id: m.id,
                status: m.status ?? 'offline',
                last_seen_at: m.last_seen_at ?? null,
            }))
        );
    }, [members, setPresenceBatch]);

    // Open the socket on mount if the user has a token. The store is
    // idempotent so re-renders do not open multiple connections.
    useEffect(() => {
        connectSocket();
    }, [connectSocket]);

    // Header title pulls the channel name. Page title mirrors it.
    const title = channel?.name ? `#${channel.name}` : 'Chat';

    return (
        <>
            <Head title={title} />

            <div className="flex h-screen w-screen overflow-hidden bg-deep-space-900 text-fg">
                <ServerSidebar
                    servers={otherServers ? [server, ...otherServers].filter(Boolean) : [server].filter(Boolean)}
                    activeServerId={server?.id}
                />

                <ChannelList server={server} activeChannelId={channel?.id} />

                <main className="flex min-w-0 flex-1 flex-col">
                    <ChatHeader channel={channel} server={server} />

                    {room && channel ? (
                        <>
                            <MessageList
                                room={room}
                                initialMessages={messages}
                                initialCursor={nextCursor}
                                serverId={server.id}
                                channelId={channel.id}
                                members={members}
                            />
                            <MessageInput
                                serverId={server.id}
                                channelId={channel.id}
                                disabled={!socketConnected}
                            />
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-sm text-fg-muted">
                            Elige un canal para empezar a chatear.
                        </div>
                    )}
                </main>

                <MemberList members={members} currentUserId={auth?.user?.id} />
            </div>
        </>
    );
}
