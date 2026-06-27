import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserAvatar from '../UserAvatar';

const mockUser = (overrides = {}) => ({
    id: 42,
    display_name: 'Alice Smith',
    avatar_url: null,
    status: 'offline',
    ...overrides,
});

describe('UserAvatar', () => {
    beforeEach(() => {
        window.axios = { get: vi.fn(), post: vi.fn(), patch: vi.fn() };
    });

    it('returns null when user prop is null/undefined', () => {
        const { container } = render(<UserAvatar user={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders initials when no avatar_url', () => {
        render(<UserAvatar user={mockUser({ display_name: 'Alice Smith' })} />);
        expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('renders initials when display_name has two parts', () => {
        render(<UserAvatar user={mockUser({ display_name: 'Bob Jones' })} />);
        expect(screen.getByText('BJ')).toBeInTheDocument();
    });

    it('renders avatar image when avatar_url is provided', () => {
        render(<UserAvatar user={mockUser({ avatar_url: 'https://example.com/avatar.png' })} />);
        // img has alt="" so it's role="presentation"
        const img = screen.getByRole('presentation');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('renders with PresenceBadge when showPresence is true', () => {
        render(<UserAvatar user={mockUser()} showPresence={true} />);
        const badge = document.querySelector('[data-status]');
        expect(badge).toBeInTheDocument();
    });

    it('does NOT render badge when showPresence is false', () => {
        render(<UserAvatar user={mockUser()} showPresence={false} />);
        const badge = document.querySelector('[data-status]');
        expect(badge).toBeNull();
    });

    it('applies size class correctly', () => {
        const { rerender } = render(<UserAvatar user={mockUser()} size="xs" />);
        const avatar = screen.getByLabelText('Alice Smith');
        expect(avatar).toHaveClass('h-6', 'w-6', 'text-[10px]');

        rerender(<UserAvatar user={mockUser()} size="lg" />);
        expect(screen.getByLabelText('Alice Smith')).toHaveClass('h-12', 'w-12', 'text-base');
    });

    it('has correct aria-label', () => {
        render(<UserAvatar user={mockUser({ display_name: 'Charlie Day' })} />);
        expect(screen.getByLabelText('Charlie Day')).toBeInTheDocument();
    });
});
