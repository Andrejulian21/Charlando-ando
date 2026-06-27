import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import ChannelList from '../../components/Chat/ChannelList';
import MemberList from '../../components/Chat/MemberList';
import MessageList from '../../components/Chat/MessageList';
import ChatComposer from '../../components/Chat/ChatComposer';
import UserFloatingBar from '../../components/Layout/UserFloatingBar';
import ChatLayout from '../../components/Layout/ChatLayout';
import { useChatStore } from '../../stores/useChatStore';

export default function ChatShow({ server, messages = [], nextCursor = null, members = [], otherServers = [], auth }) {
    const setPresenceBatch = useChatStore((s) => s.setPresenceBatch);
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);
    const setCurrentServer = useChatStore((s) => s.setCurrentServer);
    const connectSocket = useChatStore((s) => s.connectSocket);

    const room = `server:${server.id}`;

    useEffect(() => {
        if (auth?.user) setCurrentUser(auth.user);
        if (server) setCurrentServer(server);
        if (Array.isArray(members) && members.length > 0) {
            setPresenceBatch(
                members.map((m) => ({
                    user_id: m.id,
                    status: m.status ?? 'offline',
                    last_seen_at: m.last_seen_at ?? null,
                })),
            );
        }
        try {
            connectSocket();
        } catch (e) {
            console.warn('[ChatShow] socket:', e);
        }
    }, []);

    return (
        <>
            <Head title={server?.name ?? 'Chat'} />
            <ChatLayout
                sidebar={
                    <ServerSidebar
                        servers={otherServers ? [server, ...otherServers].filter(Boolean) : [server].filter(Boolean)}
                        activeServerId={server?.id}
                    />
                }
                channelList={
                    <ChannelList
                        server={server}
                        activeChannelId={null}
                    />
                }
                memberList={
                    <MemberList members={members ?? []} currentUserId={auth?.user?.id} />
                }
            >
                <MessageList
                    room={room || ''}
                    initialMessages={messages}
                    initialCursor={nextCursor}
                    serverId={server.id}
                    fetchUrl={`/api/servers/${server.id}/messages`}
                    members={members}
                />
                <ChatComposer
                    actionUrl={`/api/servers/${server.id}/messages`}
                    room={`server:${server.id}`}
                    placeholder="Mensaje"
                />
            </ChatLayout>
            <UserFloatingBar />
        </>
    );
}
