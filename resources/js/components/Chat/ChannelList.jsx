// Per-server column listing the text/voice channels. The #general channel
// is treated as the default — every server is guaranteed to have one by
// the ServerController. Channels are grouped by category; the first
// group is always the un-categorised "Text Channels" bucket so a server
// with no custom categories still renders sensibly.

import { Link, usePage } from '@inertiajs/react';

function ChannelRow({ channel, active, serverId }) {
    const href = `/chat/${serverId}/${channel.id}`;
    const isText = (channel.type ?? 'text') === 'text';
    return (
        <li>
            <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    active
                        ? 'bg-deep-space-600 text-fg'
                        : 'text-fg-muted hover:bg-deep-space-700 hover:text-fg'
                }`}
            >
                <ChannelIcon type={channel.type} />
                <span className="truncate">{channel.name}</span>
            </Link>
        </li>
    );
}

function ChannelIcon({ type }) {
    if (type === 'voice') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current opacity-70">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
        );
    }
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 stroke-current opacity-70">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-7 8l3-3h7a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h.5z" fill="none" />
        </svg>
    );
}

export default function ChannelList({ server, activeChannelId }) {
    const page = usePage();
    if (!server) {
        return (
            <aside
                aria-label="Channels"
                className="flex w-60 shrink-0 flex-col items-center justify-center border-r border-deep-space-700 bg-deep-space-800 p-4 text-center text-sm text-fg-subtle"
            >
                Pick a server from the left to start chatting.
            </aside>
        );
    }

    const channels = (server.channels ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const textChannels = channels.filter((c) => (c.type ?? 'text') === 'text');
    const voiceChannels = channels.filter((c) => c.type === 'voice');

    return (
        <aside
            aria-label={`Channels for ${server.name}`}
            className="flex w-60 shrink-0 flex-col border-r border-deep-space-700 bg-deep-space-800"
        >
            <header className="flex h-14 items-center border-b border-deep-space-700 px-4">
                <h2 className="truncate font-display text-sm font-semibold text-fg">{server.name}</h2>
            </header>

            <div className="flex-1 overflow-y-auto px-2 py-3">
                <ChannelGroup
                    label="Text channels"
                    channels={textChannels}
                    activeChannelId={activeChannelId}
                    serverId={server.id}
                />
                {voiceChannels.length > 0 && (
                    <ChannelGroup
                        label="Voice channels"
                        channels={voiceChannels}
                        activeChannelId={activeChannelId}
                        serverId={server.id}
                    />
                )}
            </div>

            <UserBar user={page.props?.auth?.user ?? page.props?.currentUser ?? null} />
        </aside>
    );
}

function ChannelGroup({ label, channels, activeChannelId, serverId }) {
    return (
        <section className="mb-3">
            <h3 className="mb-1 flex items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3 w-3 fill-current opacity-60">
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                </svg>
                {label}
            </h3>
            {channels.length === 0 ? (
                <p className="px-2 text-xs text-fg-subtle">No channels yet.</p>
            ) : (
                <ul className="space-y-0.5">
                    {channels.map((channel) => (
                        <ChannelRow
                            key={channel.id}
                            channel={channel}
                            active={String(channel.id) === String(activeChannelId)}
                            serverId={serverId}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function UserBar({ user }) {
    if (!user) {
        return (
            <footer className="flex h-14 items-center justify-between border-t border-deep-space-700 px-3 text-xs text-fg-subtle">
                <span>Not signed in</span>
                <Link href="/login" className="rounded-button bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover">Sign in</Link>
            </footer>
        );
    }
    return (
        <footer className="flex h-14 items-center justify-between border-t border-deep-space-700 px-3 text-xs text-fg-muted">
            <span className="truncate">{user.display_name || user.name}</span>
            <Link href="/settings" className="rounded-button bg-deep-space-700 px-2 py-1 text-[11px] font-medium text-fg-muted hover:bg-deep-space-600 hover:text-fg">
                Settings
            </Link>
        </footer>
    );
}
