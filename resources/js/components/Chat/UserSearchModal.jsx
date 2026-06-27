// Modal for searching users and starting direct message conversations.
// Renders as an overlay with a debounced search input and a results list.
// Clicking a result POSTs to /api/dms and navigates to the DM thread.

import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Skeleton from '../ui/Skeleton';
import Icon from '../ui/Icon';

export default function UserSearchModal({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(null); // user id being navigated
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            // Reset state when closing
            setQuery('');
            setResults([]);
            setCreating(null);
        }
    }, [isOpen]);

    // Debounced search — empty query returns all users
    useEffect(() => {
        if (!isOpen) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const fetchUsers = async (searchTerm) => {
            setLoading(true);
            try {
                const params = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
                const res = await window.axios.get(`/api/users/search${params}`);
                setResults(res.data?.data ?? []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        // Empty query → fetch all users (no debounce, immediate)
        if (query.trim() === '') {
            fetchUsers('');
            return;
        }

        // Non-empty → debounce 300ms, then search
        debounceRef.current = setTimeout(() => fetchUsers(query.trim()), 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, isOpen]);

    const handleResultClick = async (user) => {
        if (creating !== null) return;
        setCreating(user.id);
        try {
            const res = await window.axios.post('/api/dms', { user_id: user.id });
            router.visit(`/dms/${res.data.data.id}`, { replace: true });
        } catch {
            // Stay on current page if creation fails
        } finally {
            setCreating(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buscar usuarios">
            {/* Search input */}
            <div className="mb-4">
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, apodo o correo…"
                    glass
                    className="w-full"
                />
            </div>

            {/* Results */}
            <ul className="max-h-80 overflow-y-auto">
                {loading && (
                    <li className="flex flex-col items-center gap-2 py-6">
                        <Skeleton variant="text" count={3} />
                    </li>
                )}
                {!loading && query.trim() !== '' && results.length === 0 && (
                    <li className="flex justify-center py-6 text-sm text-fg-tertiary">Sin resultados</li>
                )}
                {!loading && results.length === 0 && query.trim() === '' && (
                    <li className="flex justify-center py-6 text-sm text-fg-tertiary">Escribe para buscar usuarios</li>
                )}
                {!loading &&
                    results.map((user) => (
                        <li key={user.id}>
                            <button
                                onClick={() => handleResultClick(user)}
                                disabled={creating !== null}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 [transition-timing-function:var(--spring-standard)] hover:glass active:scale-[0.98] disabled:opacity-50"
                            >
                                {/* Avatar */}
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full glass text-sm font-semibold text-fg-primary">
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
                                    <span className="block truncate text-sm font-medium text-fg-primary">
                                        {user.display_name || user.name}
                                    </span>
                                    <span className="block truncate text-xs text-fg-tertiary">@{user.name}</span>
                                </span>

                                {/* DM icon */}
                                {creating === user.id ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                                ) : (
                                    <Icon name="MessageCircle" size={16} className="shrink-0 text-fg-tertiary" />
                                )}
                            </button>
                        </li>
                    ))}
            </ul>
        </Modal>
    );
}
