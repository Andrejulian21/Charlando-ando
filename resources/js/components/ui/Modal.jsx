import { useEffect, useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Icon from './Icon';

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
    const { containerRef } = useFocusTrap(isOpen, onClose);
    const [closing, setClosing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setClosing(false);
            document.body.style.overflow = 'hidden';
        } else {
            setClosing(true);
            setTimeout(() => {
                setMounted(false);
                document.body.style.overflow = '';
            }, 200);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            onClose();
            document.body.style.overflow = '';
        }, 200);
    };

    if (!isOpen && !mounted) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}>
            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
                aria-hidden="true"
            />
            {/* Modal */}
            <div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={[
                    'relative w-full rounded-xl p-6 shadow-2xl',
                    'glass-heavy',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                    !closing && 'animate-spring-in',
                    closing && 'scale-95 opacity-0 transition-all duration-200',
                    SIZES[size] || SIZES.md,
                    className,
                ].join(' ')}
            >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    {title && (
                        <h2 className="text-subtitle font-semibold text-fg-primary">{title}</h2>
                    )}
                    <button
                        onClick={handleClose}
                        className="ml-auto rounded-md p-1.5 text-fg-tertiary transition-colors hover:bg-surface-elevated hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Cerrar"
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>
                {/* Content */}
                {children}
            </div>
        </div>
    );
}
