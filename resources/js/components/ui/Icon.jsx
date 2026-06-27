import { icons } from 'lucide-react';

const FALLBACK = () => (
    <svg className="h-5 w-5 text-fg-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z" />
    </svg>
);

export default function Icon({ name, size = 20, className = '' }) {
    const LucideIcon = icons[name];
    if (!LucideIcon) return <FALLBACK />;
    return <LucideIcon size={size} className={className} />;
}