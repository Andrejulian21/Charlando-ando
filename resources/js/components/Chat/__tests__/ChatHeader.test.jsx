import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatHeader from '../ChatHeader';

describe('ChatHeader', () => {
    beforeEach(() => {
        window.axios = { get: vi.fn(), post: vi.fn(), patch: vi.fn() };
    });

    it('returns null when channel is null', () => {
        const { container } = render(<ChatHeader channel={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders channel name', () => {
        render(<ChatHeader channel={{ name: 'general', type: 'text' }} />);
        expect(screen.getByRole('heading', { name: 'general' })).toBeInTheDocument();
    });

    it('renders channel topic when provided', () => {
        render(<ChatHeader channel={{ name: 'general', type: 'text', topic: 'Company-wide announcements' }} />);
        expect(screen.getByText('Company-wide announcements')).toBeInTheDocument();
    });

    it('does NOT render topic when not provided', () => {
        const { container } = render(<ChatHeader channel={{ name: 'general', type: 'text' }} />);
        expect(container.querySelector('p')).toBeNull();
    });

    it('shows server name when server prop is provided', () => {
        render(<ChatHeader channel={{ name: 'general', type: 'text' }} server={{ name: 'My Server' }} />);
        // Text is split across elements: "en " + "My Server"
        expect(screen.getByText((content) => content.includes('My Server'))).toBeInTheDocument();
    });
});
