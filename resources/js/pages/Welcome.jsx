export default function Welcome({ appName }) {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
            <div className="max-w-xl text-center space-y-6">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Foundation scaffold ready
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-fg">
                    {appName}
                </h1>
                <p className="text-fg-muted">
                    A real-time chat platform — Laravel 13, Inertia.js, React, Tailwind 4, and the
                    Deep Space theme. Auth, channels, and WebSocket bridge land in the next PRs.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        type="button"
                        className="rounded-button bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary-active transition-colors"
                    >
                        Sign in with Google
                    </button>
                    <span className="text-xs text-fg-subtle">PR2 wires the OAuth handshake</span>
                </div>
            </div>
        </main>
    );
}
