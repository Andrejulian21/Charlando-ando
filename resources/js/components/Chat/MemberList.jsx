// Right-hand column listing server members grouped by role. Each row
// shows the member's avatar (with a presence dot) and display name. The
// list can be collapsed by the user — we just toggle a `collapsed` class
// on the aside so the underlying state is owned here rather than in the
// parent.

import { useState } from 'react';
import UserAvatar from '../Presence/UserAvatar';
import LastSeen from '../Presence/LastSeen';
import { useUserPresence } from '../../stores/useChatStore';

function MemberRow({ member, currentUserId }) {
    // Subscribe to live presence updates for this member.
    const live = useUserPresence(member.id);
    const status = live?.status ?? member.status ?? 'offline';
    const enriched = { ...member, status };

    return (
        <li>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-deep-space-700 hover:text-fg">
                <UserAvatar user={enriched} size="sm" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg-muted">
                        {member.display_name || member.name}
                        {Number(member.id) === Number(currentUserId) && (
                            <span className="ml-1 text-[10px] text-fg-subtle">(tú)</span>
                        )}
                    </p>
                    <LastSeen
                        userId={member.id}
                        fallbackStatus={status}
                        lastSeenAt={member.last_seen_at}
                        className="mt-0.5 block"
                    />
                </div>
            </div>
        </li>
    );
}

export default function MemberList({ members = [], currentUserId }) {
    const [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
        return (
            <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Mostrar lista de miembros"
                className="flex w-8 shrink-0 items-center justify-center border-l border-deep-space-700 bg-deep-space-800 text-fg-muted hover:text-fg"
            >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                    <path d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" />
                </svg>
            </button>
        );
    }

    // Group by online first, then offline. The actual role-based grouping
    // would require per-server role data on each member; we keep it simple
    // and let the backend provide richer ordering later.
    const online = members.filter((m) => {
        // We don't know status here synchronously; presence is async. Treat
        // members with a non-null status from the server payload as online.
        return m.status && m.status !== 'offline' && m.status !== 'invisible';
    });
    const offline = members.filter((m) => !online.includes(m));

    return (
        <aside
            aria-label="Lista de miembros"
            className="flex w-60 shrink-0 flex-col border-l border-deep-space-700 bg-deep-space-800"
        >
            <header className="flex h-14 items-center justify-between border-b border-deep-space-700 px-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                    Miembros — {members.length}
                </h2>
                <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    aria-label="Ocultar lista de miembros"
                    className="rounded-md p-1 text-fg-muted hover:bg-deep-space-700 hover:text-fg"
                >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                        <path d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0z" />
                    </svg>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-2 py-3">
                {online.length > 0 && (
                    <section className="mb-3">
                        <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                            En línea — {online.length}
                        </h3>
                        <ul className="space-y-0.5">
                            {online.map((m) => (
                                <MemberRow key={`online-${m.id}`} member={m} currentUserId={currentUserId} />
                            ))}
                        </ul>
                    </section>
                )}

                {offline.length > 0 && (
                    <section>
                        <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                            Desconectados — {offline.length}
                        </h3>
                        <ul className="space-y-0.5 opacity-70">
                            {offline.map((m) => (
                                <MemberRow key={`offline-${m.id}`} member={m} currentUserId={currentUserId} />
                            ))}
                        </ul>
                    </section>
                )}

                {members.length === 0 && (
                    <p className="px-2 text-xs text-fg-subtle">Aún no hay miembros.</p>
                )}
            </div>
        </aside>
    );
}
