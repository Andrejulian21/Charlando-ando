import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PresenceBadge from '../PresenceBadge';

describe('PresenceBadge', () => {
    it('renders with default offline status', () => {
        render(<PresenceBadge />);
        const badge = screen.getByLabelText('Desconectado');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute('data-status', 'offline');
    });

    it('renders En línea label for online status', () => {
        render(<PresenceBadge status="online" />);
        expect(screen.getByLabelText('En línea')).toHaveAttribute('data-status', 'online');
    });

    it('renders Ausente label for idle status', () => {
        render(<PresenceBadge status="idle" />);
        expect(screen.getByLabelText('Ausente')).toHaveAttribute('data-status', 'idle');
    });

    it('applies the correct CSS class for each status', () => {
        const { rerender } = render(<PresenceBadge status="online" />);
        expect(screen.getByLabelText('En línea')).toHaveClass('bg-success');

        rerender(<PresenceBadge status="idle" />);
        expect(screen.getByLabelText('Ausente')).toHaveClass('bg-warning');

        rerender(<PresenceBadge status="dnd" />);
        expect(screen.getByLabelText('No molestar')).toHaveClass('bg-danger');

        rerender(<PresenceBadge status="offline" />);
        expect(screen.getByLabelText('Desconectado')).toHaveClass('bg-fg-subtle');
    });

    it('renders with custom className', () => {
        render(<PresenceBadge className="my-custom-class" />);
        expect(screen.getByLabelText('Desconectado')).toHaveClass('my-custom-class');
    });

    it('renders with different sizes', () => {
        const { rerender } = render(<PresenceBadge size="sm" />);
        expect(screen.getByLabelText('Desconectado')).toHaveClass('h-2', 'w-2');

        rerender(<PresenceBadge size="md" />);
        expect(screen.getByLabelText('Desconectado')).toHaveClass('h-2.5', 'w-2.5');

        rerender(<PresenceBadge size="lg" />);
        expect(screen.getByLabelText('Desconectado')).toHaveClass('h-3', 'w-3');
    });

    it('renders with ring by default', () => {
        render(<PresenceBadge />);
        expect(screen.getByLabelText('Desconectado')).toHaveClass('ring-2', 'ring-surface-base');
    });

    it('renders without ring when withRing is false', () => {
        render(<PresenceBadge withRing={false} />);
        expect(screen.getByLabelText('Desconectado')).not.toHaveClass('ring-2');
    });
});
