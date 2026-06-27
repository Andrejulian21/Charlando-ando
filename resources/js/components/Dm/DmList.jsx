// Conversation list for the DM surface. Each row links to /dms/{id} and
// shows the other participant's avatar (with a presence dot) plus the
// thread's last activity time.

import { Link } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import { useUserPresence } from '../../stores/useChatStore';

function pickOther(thread, currentUserId) {
    if (!thread) return null;
    if (Number(thread.user_a_id) === Number(currentUserId)) return thread.user_b ?? thread.userB ?? null;
    return thread.user_a ?? thread.userA ?? null;
}

function relativeTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '';
    const diffMs = Date.now() - date.valueOf();
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.round(diffH / 24);
    if (diffD < 7) return `hace ${diffD} d`;
    return date.toLocaleDateString();
}

function DmRow({ thread, currentUserId, active, index = 0 }) {
    const other = pickOther(thread, currentUserId);
    // Subscribe to live presence for the other participant.
    const live = useUserPresence(other?.id);
    const status = live?.status ?? other?.status ?? 'offline';
    const enrichedOther = other ? { ...other, status } : null;

    return (
        <li
            style={{ '--index': index }}
            className="animate-[slide-up_300ms_var(--spring-gentle)_calc(var(--index)*50ms)_both]"
        >
            <Link
                href={`/dms/${thread.id}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                    active
                        ? 'bg-surface-hover text-fg-primary'
                        : 'text-fg-secondary hover:bg-surface-elevated hover:text-fg-primary'
                }`}
            >
                {enrichedOther ? (
                    <UserAvatar user={enrichedOther} size="md" />
                ) : (
                    <span className="h-10 w-10 rounded-full bg-surface-elevated" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg-primary">
                        {other?.display_name || other?.name || `User #${other?.id ?? '?'}`}
                    </p>
                    <p className="truncate text-[11px] text-fg-tertiary">
                        {relativeTime(thread.last_message_at)}
                    </p>
                </div>
            </Link>
        </li>
    );
}

export default function DmList({ threads = [], currentUserId, activeDmId }) {
    return (
        <aside
            aria-label="Mensajes directos"
            className="glass flex h-full w-72 shrink-0 flex-col"
        >
            <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
                <h2 className="font-display text-sm font-semibold text-fg-primary">Mensajes directos</h2>
            </header>
            <div className="flex-1 overflow-y-auto px-2 pb-16 pt-3">
                {threads.length === 0 ? (
                    <p className="px-2 text-sm text-fg-tertiary">
                        Aún no tienes conversaciones. Abre un perfil para iniciar un chat.
                    </p>
                ) : (
                    <ul className="space-y-0.5">
                        {threads.map((thread, i) => (
                            <DmRow
                                key={thread.id}
                                thread={thread}
                                currentUserId={currentUserId}
                                active={String(thread.id) === String(activeDmId)}
                                index={i}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}
