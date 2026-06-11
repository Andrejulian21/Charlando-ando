// Tiny status dot used by avatars, member lists, and inline nick mentions.
// Statuses map to a colour that matches the convention used in the rest
// of the design system (success for online, warning for idle, danger for
// dnd, subtle for offline / invisible).

const STATUS_STYLES = {
    online: 'bg-success',
    idle: 'bg-warning',
    dnd: 'bg-danger',
    invisible: 'bg-fg-subtle',
    offline: 'bg-fg-subtle',
};

const STATUS_LABEL = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do not disturb',
    invisible: 'Invisible',
    offline: 'Offline',
};

const SIZE_CLASSES = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
};

export default function PresenceBadge({ status = 'offline', size = 'md', className = '', withRing = true }) {
    const colour = STATUS_STYLES[status] ?? STATUS_STYLES.offline;
    const label = STATUS_LABEL[status] ?? 'Unknown';
    const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
    const ringClass = withRing ? 'ring-2 ring-deep-space-900' : '';

    return (
        <span
            aria-label={label}
            title={label}
            data-status={status}
            className={`inline-block rounded-full ${colour} ${sizeClass} ${ringClass} ${className}`.trim()}
        />
    );
}
