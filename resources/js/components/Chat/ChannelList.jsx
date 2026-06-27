// Per-server column listing the text/voice channels. The #general channel
// is treated as the default — every server is guaranteed to have one by
// the ServerController. Channels are grouped by category; the first
// group is always the un-categorised "Text Channels" bucket so a server
// with no custom categories still renders sensibly.

import { Link } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import { useUserPresence } from '../../stores/useChatStore';

function ChannelRow({ channel, active, serverId, index = 0 }) {
    const href = `/chat/${serverId}/${channel.id}`;
    const isText = (channel.type ?? 'text') === 'text';
    const isGeneral = channel.name === 'general';
    return (
        <li
            style={{ '--index': index }}
            className="animate-[slide-up_300ms_var(--spring-gentle)_calc(var(--index)*50ms)_both]"
        >
            <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    active ? 'bg-surface-hover text-fg-primary' : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg-primary'
                }`}
            >
                <ChannelIcon type={channel.type} />
                <span className="truncate">{channel.name}</span>
                {isGeneral && (
                    <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        default
                    </span>
                )}
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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 8h10M7 12h6m-7 8l3-3h7a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2h.5z"
                fill="none"
            />
        </svg>
    );
}

export default function ChannelList({ server, activeChannelId, threads = [], currentUserId }) {
    if (!server) {
        return (
            <aside
                aria-label="Mensajes directos"
                className="glass flex h-full w-60 shrink-0 flex-col"
            >
                <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
                    <h2 className="font-display text-sm font-semibold text-fg-primary">Mensajes directos</h2>
                </header>
                <div className="flex-1 overflow-y-auto px-2 pb-16 pt-3">
                    {!threads || threads.length === 0 ? (
                        <p className="px-2 text-sm text-fg-tertiary">Aún no tienes conversaciones.</p>
                    ) : (
                        <ul className="space-y-0.5">
                            {threads.map((thread) => {
                                const other =
                                    Number(thread.user_a_id) === Number(currentUserId)
                                        ? (thread.user_b ?? thread.userB)
                                        : (thread.user_a ?? thread.userA);
                                if (!other) return null;
                                return (
                                    <li key={thread.id}>
                                        <Link
                                            href={`/dms/${thread.id}`}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg-primary"
                                        >
                                            <UserAvatar user={other} size="md" />
                                            <span className="truncate">{other.display_name || other.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>
        );
    }

    const channels = (server.channels ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const textChannels = channels.filter((c) => (c.type ?? 'text') === 'text');
    const voiceChannels = channels.filter((c) => c.type === 'voice');

    return (
        <aside
            aria-label={`Canales de ${server.name}`}
            className="glass flex h-full w-60 shrink-0 flex-col"
        >
            <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
                <h2 className="truncate font-display text-sm font-semibold text-fg-primary">{server.name}</h2>
            </header>

            <div className="flex-1 overflow-y-auto px-2 pb-16 pt-3">
                <ChannelGroup
                    label="Canales de texto"
                    channels={textChannels}
                    activeChannelId={activeChannelId}
                    serverId={server.id}
                />
                {voiceChannels.length > 0 && (
                    <ChannelGroup
                        label="Canales de voz"
                        channels={voiceChannels}
                        activeChannelId={activeChannelId}
                        serverId={server.id}
                    />
                )}
            </div>
        </aside>
    );
}

function ChannelGroup({ label, channels, activeChannelId, serverId }) {
    return (
        <section className="mb-3">
            <h3 className="mb-1 flex items-center gap-1 px-2 text-caption font-semibold uppercase tracking-wider text-fg-tertiary">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3 w-3 fill-current opacity-60">
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                </svg>
                {label}
            </h3>
            {channels.length === 0 ? (
                <p className="px-2 text-xs text-fg-tertiary">Aún no hay canales.</p>
            ) : (
                <ul className="space-y-0.5">
                    {channels.map((channel, i) => (
                        <ChannelRow
                            key={channel.id}
                            channel={channel}
                            active={String(channel.id) === String(activeChannelId)}
                            serverId={serverId}
                            index={i}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
