export default function Input({
    label,
    error,
    helperText,
    icon,
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
            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-fg-muted">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={[
                        'block w-full rounded-md border px-3 py-2 text-sm text-fg-primary placeholder-fg-subtle transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        '[transition-timing-function:var(--spring-standard)]',
                        glass
                            ? 'glass border-transparent focus:ring-white/10'
                            : 'bg-surface border-border',
                        icon ? 'pl-10' : '',
                        error
                            ? 'border-danger focus:border-danger focus:ring-danger/30'
                            : glass
                                ? 'focus:ring-white/10'
                                : 'focus:border-primary focus:ring-primary/30',
                        props.disabled ? 'cursor-not-allowed opacity-50' : '',
                    ].filter(Boolean).join(' ')}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            {helperText && !error && <p className="text-xs text-fg-muted">{helperText}</p>}
        </div>
    );
}