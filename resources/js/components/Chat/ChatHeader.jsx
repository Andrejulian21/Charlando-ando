// Sticky header above the message list. Shows the channel name, type
// badge, and topic. Stays in the DOM across message-list re-renders so
// the layout does not jump.

export default function ChatHeader({ channel, server }) {
    if (!channel) return null;

    const isText = (channel.type ?? 'text') === 'text';
    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
            <span aria-hidden="true" className="text-xl text-fg-muted">
                {isText ? '#' : '🔊'}
            </span>
            <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-base font-semibold text-fg">{channel.name}</h1>
                {channel.topic && <p className="truncate text-xs text-fg-muted">{channel.topic}</p>}
            </div>
            {server && (
                <span className="hidden text-xs text-fg-subtle sm:inline">
                    en <span className="text-fg-muted">{server.name}</span>
                </span>
            )}
        </header>
    );
}
