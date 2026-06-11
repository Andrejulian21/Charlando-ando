// "Last seen X ago" pill used in member lists and DM info panels. Falls
// back to a short status label (Online / Idle / DND) when the user is
// currently present, otherwise renders a relative timestamp from the
// live presence record or the static `lastSeenAt` prop.

import { useUserPresence } from '../../stores/useChatStore';

const STATUS_LABEL = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do not disturb',
};

const STATUS_CLASS = {
    online: 'text-success',
    idle: 'text-warning',
    dnd: 'text-danger',
};

function relativeTime(input) {
    if (!input) return null;
    const date = new Date(input);
    if (Number.isNaN(date.valueOf())) return null;
    const diffMs = Date.now() - date.valueOf();
    if (diffMs < 0) return 'just now';
    const diffSec = Math.round(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH} hr ago`;
    const diffD = Math.round(diffH / 24);
    if (diffD < 30) return `${diffD} d ago`;
    return date.toLocaleDateString();
}

export default function LastSeen({ userId, fallbackStatus, lastSeenAt, className = '' }) {
    const live = useUserPresence(userId);

    const status = live?.status ?? fallbackStatus ?? 'offline';
    if (status === 'online' || status === 'idle' || status === 'dnd') {
        return (
            <span
                className={`text-[10px] ${STATUS_CLASS[status]} ${className}`.trim()}
                data-status={status}
            >
                {STATUS_LABEL[status]}
            </span>
        );
    }

    // Offline / invisible — show last-seen.
    const seen = live?.lastSeen ?? lastSeenAt ?? null;
    const text = seen ? `last seen ${relativeTime(seen)}` : 'offline';
    return (
        <span className={`text-[10px] text-fg-subtle ${className}`.trim()}>{text}</span>
    );
}
