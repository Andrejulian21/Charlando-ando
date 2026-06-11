// Landing page for /chat. The layout is always the same — server rail,
// channel list, main column, member list — but the right-hand panes are
// empty until a server (and a channel) is picked. If the user has at
// least one server we auto-navigate to its first channel so the page is
// never useless; if they have none we show a friendly empty state.

import { Head, router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import ChannelList from '../../components/Chat/ChannelList';
import MemberList from '../../components/Chat/MemberList';
import { useChatStore } from '../../stores/useChatStore';

function pickDefaultTarget(servers) {
    if (!Array.isArray(servers) || servers.length === 0) return null;
    const first = servers[0];
    const channels = (first?.channels ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (channels.length === 0) return { server: first, channel: null };
    return { server: first, channel: channels[0] };
}

export default function ChatIndex({ servers = [], auth }) {
    const redirected = useRef(false);
    const setChannels = useChatStore((s) => s.setChannels);
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);

    // Hydrate the store with the server list once, and forward the auth
    // user to the store so the rest of the SPA can read it without a
    // refetch.
    useEffect(() => {
        for (const server of servers) {
            setChannels(server.id, server.channels ?? []);
        }
        if (auth?.user) setCurrentUser(auth.user);
    }, [servers, auth, setChannels, setCurrentUser]);

    // Auto-navigate to the first server's first channel so the user is
    // never stuck on a blank page.
    useEffect(() => {
        if (redirected.current) return;
        const target = pickDefaultTarget(servers);
        if (!target?.server) return;
        redirected.current = true;
        const url = target.channel
            ? `/chat/${target.server.id}/${target.channel.id}`
            : `/chat/${target.server.id}`;
        router.visit(url, { replace: true });
    }, [servers]);

    return (
        <>
            <Head title="Chat" />

            <div className="flex h-screen w-screen overflow-hidden bg-deep-space-900 text-fg">
                <ServerSidebar servers={servers} />

                <ChannelList server={null} activeChannelId={null} />

                <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    {servers.length === 0 ? (
                        <EmptyState
                            title="No servers yet"
                            description="You have not been added to a server. Ask a friend for an invite link, or check back soon."
                        />
                    ) : (
                        <EmptyState
                            title="Welcome to Charlando-ando"
                            description="Pick a channel on the left to start chatting. We'll route you automatically."
                        />
                    )}
                </main>

                <MemberList members={[]} />
            </div>
        </>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="max-w-md space-y-3">
            <h1 className="font-display text-2xl font-semibold text-fg">{title}</h1>
            <p className="text-sm text-fg-muted">{description}</p>
        </div>
    );
}
