// Vertical strip of server icons on the far left. Each entry is either the
// server's icon (if it has an icon_url) or the first letter of its name
// against a deterministic hue. The active server gets a rounded accent
// "pill" behind it — same affordance as the reference design.

import { Link } from '@inertiajs/react';
import { useState } from 'react';
import UserSearchModal from './UserSearchModal';

function hashToHue(id) {
    const n = typeof id === 'number' ? id : Number.parseInt(String(id), 10) || 0;
    return n * 137.508 % 360;
}

function initialFor(server) {
    const source = (server?.name ?? '?').trim();
    return (source[0] ?? '?').toUpperCase();
}

function ServerIcon({ server, active }) {
    const hue = hashToHue(server.id);
    const baseClass = 'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold transition-all';
    const stateClass = active
        ? 'rounded-xl bg-primary text-white shadow-md shadow-primary/30'
        : 'bg-deep-space-700 text-fg hover:rounded-xl hover:bg-primary hover:text-white';

    if (server.icon_url) {
        return (
            <span className={`${baseClass} ${stateClass} overflow-hidden`}>
                <img src={server.icon_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </span>
        );
    }
    return (
        <span
            className={`${baseClass} ${stateClass}`}
            style={!active ? { backgroundColor: `hsl(${hue} 45% 28%)` } : undefined}
        >
            {initialFor(server)}
        </span>
    );
}

export default function ServerSidebar({ servers, activeServerId, homeHref = '/chat' }) {
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <>
            <nav
                aria-label="Servidores"
                className="flex w-[72px] shrink-0 flex-col items-center gap-2 border-r border-deep-space-700 bg-deep-space-800 px-2 py-4"
            >
                <Link
                    href={homeHref}
                    aria-label="Inicio"
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold transition-all ${
                        !activeServerId
                            ? 'rounded-xl bg-primary text-white shadow-md shadow-primary/30'
                            : 'bg-deep-space-700 text-fg hover:rounded-xl hover:bg-primary hover:text-white'
                    }`}
                >
                    CA
                </Link>

                {/* DM / User Search button */}
                <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Mensajes directos"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-deep-space-700 text-fg transition-all hover:rounded-xl hover:bg-primary hover:text-white"
                >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 0 1-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
                        />
                    </svg>
                </button>

                {servers && servers.length > 0 && (
                    <div aria-hidden="true" className="mx-1 h-px w-8 bg-deep-space-600" />
                )}

            <ul className="flex flex-col items-center gap-2">
                {(servers ?? []).map((server) => (
                    <li key={server.id}>
                        <Link
                            href={`/chat/${server.id}`}
                            aria-label={server.name}
                            aria-current={String(server.id) === String(activeServerId) ? 'page' : undefined}
                            title={server.name}
                        >
                            <ServerIcon server={server} active={String(server.id) === String(activeServerId)} />
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
        {searchOpen && <UserSearchModal onClose={() => setSearchOpen(false)} />}
        </>
    );
}
