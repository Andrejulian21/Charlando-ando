import { useToastStore } from '../../stores/useToastStore';
import Icon from './Icon';

const TYPE_STYLES = {
    success: 'border-l-success/60',
    error: 'border-l-danger/60',
    info: 'border-l-info/60',
};

const TYPE_ICONS = {
    success: 'CheckCircle',
    error: 'AlertCircle',
    info: 'Info',
};

function ToastItem({ toast: t }) {
    const dismiss = useToastStore((s) => s.dismiss);

    return (
        <div
            role="alert"
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            className={`glass-heavy flex items-start gap-3 rounded-xl border-l-4 p-4 shadow-2xl ${TYPE_STYLES[t.type] ?? TYPE_STYLES.info} animate-spring-in w-80`}
        >
            <span className="mt-0.5 shrink-0 text-fg-primary">
                <Icon name={TYPE_ICONS[t.type] ?? 'Info'} size={18} />
            </span>
            <p className="flex-1 text-sm text-fg-primary">{t.message}</p>
            <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar"
                className="shrink-0 rounded-md p-0.5 text-fg-tertiary transition-colors hover:bg-surface-hover hover:text-fg-primary"
            >
                <Icon name="X" size={14} />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} />
                </div>
            ))}
        </div>
    );
}
