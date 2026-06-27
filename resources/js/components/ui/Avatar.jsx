// Round avatar with optional presence dot. Falls back to coloured initials
// using a deterministic hue derived from the user id (golden angle spread).

import PresenceBadge from '../Presence/PresenceBadge';

function hashToHue(id) {
    const n = typeof id === 'number' ? id : Number.parseInt(String(id), 10) || 0;
    return (n * 137.508) % 360;
}

function initialsFor(user) {
    if (!user) return '?';
    const source = user.display_name || user.name || user.email || '';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZE_CLASSES = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-12 w-12 text-base',
};

const DOT_POSITION = {
    sm: '-bottom-0.5 -right-0.5',
    md: 'bottom-0 right-0',
    lg: 'bottom-0 right-0',
    xl: 'bottom-0.5 right-0.5',
};

export default function Avatar({ user, size = 'md', showPresence = false, status, className = '' }) {
    if (!user) return null;

    const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
    const dotPosition = DOT_POSITION[size] ?? DOT_POSITION.md;
    const hue = hashToHue(user.id);
    const initials = initialsFor(user);
    const presence = status ?? user.presence?.status ?? user.status ?? 'offline';

    return (
        <span
            className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-hover font-semibold text-fg ${sizeClass} ${className}`.trim()}
            aria-label={user.display_name || user.name || 'Avatar de usuario'}
        >
            {user.avatar_url ? (
                <img
                    src={user.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
            ) : (
                <span
                    aria-hidden="true"
                    style={{ backgroundColor: `hsl(${hue} 55% 35%)` }}
                    className="flex h-full w-full items-center justify-center"
                >
                    {initials}
                </span>
            )}
            {showPresence && (
                <span className={`absolute ${dotPosition}`}>
                    <PresenceBadge status={presence} size={size === 'xl' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
                </span>
            )}
        </span>
    );
}