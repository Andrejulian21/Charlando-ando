// Conversation list for the DM surface. Each row links to /dms/{id} and
// shows the other participant's avatar (with a presence dot) plus the
// thread's last activity time.

import { Link } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import { usePresence } from '../../stores/useChatStore';

function pickOther(thread, currentUserId) {
    if (!thread) return null;
    if (Number(thread.user_a_id) === Number(currentUserId)) return thread.userB ?? null;
    return thread.userA ?? null;
}

function relativeTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return '';
    const diffMs = Date.now() - date.valueOf();
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.round(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString();
}

function DmRow({ thread, currentUserId, active }) {
    const other = pickOther(thread, currentUserId);
    const live = usePresence(other?.id);
    const status = live?.status ?? other?.status ?? 'offline';
    const enrichedOther = other ? { ...other, status } : null;

    return (
        <li>
            <Link
                href={`/dms/${thread.id}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                    active
                        ? 'bg-deep-space-600 text-fg'
                        : 'text-fg-muted hover:bg-deep-space-700 hover:text-fg'
                }`}
            >
                {enrichedOther ? (
                    <UserAvatar user={enrichedOther} size="md" />
                ) : (
                    <span className="h-10 w-10 rounded-full bg-deep-space-600" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">
                        {other?.display_name || other?.name || `User #${other?.id ?? '?'}`}
                    </p>
                    <p className="truncate text-[11px] text-fg-subtle">
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
            aria-label="Direct messages"
            className="flex w-72 shrink-0 flex-col border-r border-deep-space-700 bg-deep-space-800"
        >
            <header className="flex h-14 items-center border-b border-deep-space-700 px-4">
                <h2 className="font-display text-sm font-semibold text-fg">Direct Messages</h2>
            </header>
            <div className="flex-1 overflow-y-auto px-2 py-3">
                {threads.length === 0 ? (
                    <p className="px-2 text-sm text-fg-subtle">
                        No conversations yet. Open a user profile to start a DM.
                    </p>
                ) : (
                    <ul className="space-y-0.5">
                        {threads.map((thread) => (
                            <DmRow
                                key={thread.id}
                                thread={thread}
                                currentUserId={currentUserId}
                                active={String(thread.id) === String(activeDmId)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}
