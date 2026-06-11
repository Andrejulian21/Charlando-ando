// OAuth landing pad. The Laravel OAuthController stores { token, user } in
// the session and redirects the browser here. This page is a client-only
// side effect: stash the token in localStorage so the socket.io client
// (echo.js) can pick it up, mirror the user into the chat store so the
// rest of the SPA can read it without a refetch, then push the user to
// /chat. We render a thin loading card while this is happening so the
// user does not see a flash of the previous /login page.

import { Head, router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/useChatStore';

const TOKEN_STORAGE_KEY = 'auth_token';

export default function Callback({ token, user }) {
    const processed = useRef(false);
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);

    useEffect(() => {
        // Guard against React 19 strict-mode double-invocation: we only
        // want to consume the session-stashed token once.
        if (processed.current) return;
        processed.current = true;

        if (typeof window === 'undefined') return;

        if (!token) {
            router.visit('/login', { replace: true });
            return;
        }

        try {
            window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } catch {
            // Storage may be unavailable; the socket still has no token in
            // that case, but the SPA itself can still function via session
            // cookies for non-socket calls.
        }

        if (user) {
            setCurrentUser(user);
        }

        router.visit('/chat', { replace: true });
    }, [token, user, setCurrentUser]);

    return (
        <>
            <Head title="Iniciando sesión" />

            <main className="min-h-screen bg-deep-space-900">
                <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
                    <div className="rounded-card border border-deep-space-600 bg-deep-space-800 p-8 shadow-xl">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-deep-space-500 border-t-primary" />
                        <h1 className="font-display text-lg font-semibold text-fg">Iniciando sesión…</h1>
                        <p className="mt-2 text-sm text-fg-muted">Espera un momento mientras terminamos.</p>
                    </div>
                </div>
            </main>
        </>
    );
}
