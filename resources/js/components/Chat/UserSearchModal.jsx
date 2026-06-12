// Modal for searching users and starting direct message conversations.
// Renders as an overlay with a debounced search input and a results list.
// Clicking a result POSTs to /api/dms and navigates to the DM thread.

import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function UserSearchModal({ onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(null); // user id being navigated
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.trim() === '') {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'include',
                });
                if (res.ok) {
                    const json = await res.json();
                    setResults(json.data ?? []);
                }
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const handleResultClick = async (user) => {
        if (creating !== null) return;
        setCreating(user.id);
        try {
            const res = await fetch('/api/dms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                credentials: 'include',
                body: JSON.stringify({ user_id: user.id }),
            });
            if (res.ok) {
                const json = await res.json();
                router.visit(`/dms/${json.data.id}`, { replace: true });
            }
        } finally {
            setCreating(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar usuarios"
        >
            <div className="flex w-full max-w-md flex-col rounded-xl border border-deep-space-600 bg-deep-space-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-deep-space-600 px-4 py-3">
                    <h2 className="font-display text-sm font-semibold text-fg">Buscar usuarios</h2>
                    <button
                        onClick={onClose}
                        className="text-fg-muted transition-colors hover:text-fg"
                        aria-label="Cerrar"
                    >
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"
                            />
                        </svg>
                    </button>
                </div>

                {/* Search input */}
                <div className="px-4 py-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por nombre, apodo o correo…"
                        className="w-full rounded-lg border border-deep-space-600 bg-deep-space-700 px-3 py-2 text-sm text-fg placeholder-fg-muted outline-none transition-colors focus:border-primary"
                    />
                </div>

                {/* Results */}
                <ul className="max-h-80 overflow-y-auto px-2 pb-3">
                    {loading && (
                        <li className="flex justify-center py-6 text-fg-muted text-sm">Buscando…</li>
                    )}
                    {!loading && query.trim() !== '' && results.length === 0 && (
                        <li className="flex justify-center py-6 text-fg-muted text-sm">Sin resultados</li>
                    )}
                    {!loading &&
                        results.map((user) => (
                            <li key={user.id}>
                                <button
                                    onClick={() => handleResultClick(user)}
                                    disabled={creating !== null}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-deep-space-700 disabled:opacity-50"
                                >
                                    {/* Avatar */}
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-deep-space-600 text-sm font-semibold text-fg">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt=""
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            (user.display_name || user.name)[0].toUpperCase()
                                        )}
                                    </span>

                                    {/* User info */}
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-fg">
                                            {user.display_name || user.name}
                                        </span>
                                        <span className="block truncate text-xs text-fg-muted">
                                            @{user.name}
                                        </span>
                                    </span>

                                    {/* DM icon */}
                                    {creating === user.id ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border border-deep-space-500 border-t-primary" />
                                    ) : (
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 20 20"
                                            className="h-4 w-4 shrink-0 text-fg-muted"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 0 1-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
}