export default function Textarea({
    label,
    error,
    helperText,
    glass = false,
    className = '',
    id,
    ...props
}) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs font-semibold uppercase tracking-wider text-fg-secondary"
                >
                    {label}
                </label>
            )}
            <textarea
                id={inputId}
                className={[
                    'block w-full rounded-md border px-3 py-2 text-sm text-fg-primary placeholder-fg-subtle transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    '[transition-timing-function:var(--spring-standard)]',
                    glass
                        ? 'glass border-transparent focus:ring-white/10'
                        : 'bg-surface border-border',
                    error
                        ? 'border-danger focus:border-danger focus:ring-danger/30'
                        : glass
                            ? 'focus:ring-white/10'
                            : 'focus:border-primary focus:ring-primary/30',
                    props.disabled ? 'cursor-not-allowed opacity-50' : '',
                ].filter(Boolean).join(' ')}
                {...props}
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            {helperText && !error && <p className="text-xs text-fg-muted">{helperText}</p>}
        </div>
    );
}