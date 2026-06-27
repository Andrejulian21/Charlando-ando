// Landing page for /chat. Shows DM threads in the sidebar (via ChannelList)
// and the same thread list in the main content area. Public servers are
// surfaced below the DM thread list so users can discover and join them.

import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import ChannelList from '../../components/Chat/ChannelList';
import UserFloatingBar from '../../components/Layout/UserFloatingBar';
import ChatLayout from '../../components/Layout/ChatLayout';
import UserAvatar from '../../components/Presence/UserAvatar';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import { useChatStore } from '../../stores/useChatStore';

export default function ChatIndex({ servers = [], publicServers = [], threads = [], currentUserId, auth }) {
    const setChannels = useChatStore((s) => s.setChannels);
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);

    const handleJoin = async (serverId) => {
        try {
            const res = await window.axios.post(`/api/servers/${serverId}/join`);
            router.visit(`/chat/${res.data.data.id}`);
        } catch {
            // Silently fail
        }
    };

    useEffect(() => {
        for (const server of servers) {
            setChannels(server.id, server.channels ?? []);
        }
        if (auth?.user) setCurrentUser(auth.user);
    }, [servers, auth, setChannels, setCurrentUser]);

    return (
        <>
            <Head title="Chat" />
            <ChatLayout
                sidebar={<ServerSidebar servers={servers} />}
                channelList={
                    <ChannelList server={null} activeChannelId={null} threads={threads} currentUserId={currentUserId} />
                }
            >
                <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    {threads.length === 0 ? (
                        <EmptyState
                            icon={<Icon name="MessageCircle" size={48} />}
                            title="Aún no tienes conversaciones"
                            description="Busca usuarios para iniciar un chat."
                        />
                    ) : (
                        <div className="w-full max-w-lg space-y-1">
                            {threads.map((thread) => {
                                const other =
                                    Number(thread.user_a_id) === Number(currentUserId)
                                        ? (thread.user_b ?? thread.userB)
                                        : (thread.user_a ?? thread.userA);
                                if (!other) return null;
                                return (
                                    <Link
                                        key={thread.id}
                                        href={`/dms/${thread.id}`}
                                        className="flex items-center gap-3 rounded-md border border-surface-elevated/60 bg-surface/70 p-3 hover:border-primary/40 transition-colors"
                                    >
                                        <UserAvatar user={other} size="md" showPresence />
                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="truncate text-sm font-medium text-fg-primary">
                                                {other.display_name || other.name}
                                            </p>
                                            <p className="text-xs text-fg-secondary">@{other.name}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </main>
            </ChatLayout>

            {publicServers.length > 0 && (
                <div className="fixed bottom-20 right-6 z-40 w-80 rounded-lg border border-surface-elevated/60 bg-surface/95 p-4 shadow-xl">
                    <h2 className="mb-3 text-left text-xs font-semibold uppercase tracking-wider text-fg-secondary">
                        Servidores públicos disponibles
                    </h2>
                    <ul className="space-y-2">
                        {publicServers.map((server) => (
                            <li key={server.id}>
                                <div className="flex flex-col rounded-md border border-surface-elevated/40 bg-surface/70 p-3 hover:border-primary/40 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="truncate text-sm font-semibold text-fg-primary">{server.name}</p>
                                            {server.members_count != null && (
                                                <span className="shrink-0 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-fg-tertiary">
                                                    {server.members_count}{' '}
                                                    {server.members_count === 1 ? 'miembro' : 'miembros'}
                                                </span>
                                            )}
                                        </div>
                                        {server.description && (
                                            <p className="mb-1 truncate text-xs text-fg-secondary">{server.description}</p>
                                        )}
                                        <p className="text-[10px] text-fg-tertiary">
                                            Creado por {server.owner?.name ?? 'Desconocido'}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleJoin(server.id)}
                                        className="mt-2 w-full"
                                    >
                                        Unirse
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <UserFloatingBar />
        </>
    );
}


