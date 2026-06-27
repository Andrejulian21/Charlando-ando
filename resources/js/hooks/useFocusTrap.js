import { useEffect, useRef, useCallback } from 'react';

export function useFocusTrap(isActive, onClose) {
    const containerRef = useRef(null);

    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];
        const selectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ];
        return Array.from(containerRef.current.querySelectorAll(selectors.join(',')));
    }, []);

    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;
            const elements = getFocusableElements();
            if (elements.length === 0) return;
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        requestAnimationFrame(() => {
            const elements = getFocusableElements();
            if (elements.length > 0) elements[0].focus();
        });

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isActive, onClose, getFocusableElements]);

    return { containerRef };
}
