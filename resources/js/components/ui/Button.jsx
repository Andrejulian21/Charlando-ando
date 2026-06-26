import { forwardRef } from 'react';

const VARIANTS = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-sm shadow-primary/20',
    secondary: 'bg-surface-elevated text-fg-primary border border-border hover:bg-surface-hover active:bg-surface-hover',
    ghost: 'bg-transparent text-fg-primary hover:bg-surface-elevated active:bg-surface-elevated',
    danger: 'bg-danger text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-danger/20',
    glass: 'glass text-fg-primary hover:bg-white/10 active:bg-white/15 shadow-lg shadow-black/20',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-body-sm rounded-md',
    md: 'px-4 py-2 text-body rounded-md',
    lg: 'px-6 py-3 text-subtitle rounded-md',
};

const Spinner = () => (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

const Button = forwardRef(function Button(
    { variant = 'primary', size = 'md', loading, disabled, icon, children, className = '', ...props },
    ref
) {
    const isDisabled = disabled || loading;
    return (
        <button
            ref={ref}
            disabled={isDisabled}
            className={[
                'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
                'active:scale-[0.97] hover:-translate-y-px',
                '[transition-timing-function:var(--spring-standard)]',
                VARIANTS[variant] || VARIANTS.primary,
                SIZES[size] || SIZES.md,
                isDisabled && 'cursor-not-allowed opacity-50',
                className,
            ].filter(Boolean).join(' ')}
            {...props}
        >
            {loading ? <Spinner /> : icon}
            {children}
        </button>
    );
});

export default Button;