// Tiny status dot used by avatars, member lists, and inline nick mentions.
// Statuses map to a colour that matches the convention used in the rest
// of the design system (success for online, warning for idle, danger for
// dnd, subtle for offline / invisible).

import { useState, useRef, useEffect } from 'react';

const STATUS_STYLES = {
    online: 'bg-success',
    idle: 'bg-warning',
    dnd: 'bg-danger',
    invisible: 'bg-fg-subtle',
    offline: 'bg-fg-subtle',
};

const STATUS_LABEL = {
    online: 'En línea',
    idle: 'Ausente',
    dnd: 'No molestar',
    invisible: 'Invisible',
    offline: 'Desconectado',
};

const SIZE_CLASSES = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
};

export default function PresenceBadge({ status = 'offline', size = 'md', className = '', withRing = true }) {
    const [pulsing, setPulsing] = useState(false);
    const prevStatus = useRef(status);
    const colour = STATUS_STYLES[status] ?? STATUS_STYLES.offline;
    const label = STATUS_LABEL[status] ?? 'Desconocido';
    const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
    const ringClass = withRing ? 'ring-2 ring-surface-base' : '';

    useEffect(() => {
        if (prevStatus.current !== status && status !== 'offline') {
            setPulsing(true);
            const timer = setTimeout(() => setPulsing(false), 300);
            prevStatus.current = status;
            return () => clearTimeout(timer);
        }
        prevStatus.current = status;
    }, [status]);

    return (
        <span
            aria-label={label}
            title={label}
            data-status={status}
            className={`inline-block rounded-full ${colour} ${sizeClass} ${ringClass} ${pulsing ? 'animate-pulse-dot' : ''} ${className}`.trim()}
        />
    );
}
