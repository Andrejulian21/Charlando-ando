// Vertical strip of server icons on the far left. Each entry is either the
// server's icon (if it has an icon_url) or the first letter of its name
// against a deterministic hue. The active server gets a rounded accent
// "pill" behind it — same affordance as the reference design.

import { Link } from '@inertiajs/react';
import { useState } from 'react';
import UserSearchModal from './UserSearchModal';
import ServerCreateModal from './ServerCreateModal';
import Icon from '../ui/Icon';
function hashToHue(id) {
    const n = typeof id === 'number' ? id : Number.parseInt(String(id), 10) || 0;
    return (n * 137.508) % 360;
}

function initialFor(server) {
    const source = (server?.name ?? '?').trim();
    return (source[0] ?? '?').toUpperCase();
}

function ServerIcon({ server, active }) {
    const hue = hashToHue(server.id);
    const baseClass =
        'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-300 [transition-timing-function:var(--spring-standard)]';
    const stateClass = active
        ? 'rounded-xl bg-primary text-white shadow-md shadow-primary/30'
        : 'bg-surface-elevated text-fg-primary hover:rounded-xl hover:bg-primary hover:text-white';

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
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <>
            <nav
                aria-label="Servidores"
                className="glass mx-4 my-4 flex h-[calc(100%-2rem)] w-[72px] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 pb-16 pt-4 shadow-2xl shadow-black/30"
            >
                <Link
                    href={homeHref}
                    aria-label="Inicio"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all overflow-hidden ${
                        !activeServerId
                            ? 'rounded-xl bg-primary shadow-md shadow-primary/30'
                            : 'bg-surface-elevated hover:rounded-xl hover:bg-primary'
                    }`}
                >
                    <img src="/icono.png" alt="Inicio" className="h-12 w-12 object-cover" />
                </Link>

                {/* DM / User Search button */}
                <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Mensajes directos"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-fg-primary transition-all hover:rounded-xl hover:bg-primary hover:text-white"
                >
                    <Icon name="MessageCircle" size={20} />
                </button>

                {servers && servers.length > 0 && (
                    <div aria-hidden="true" className="mx-1 h-px w-8 bg-border shrink-0" />
                )}

                {/* Create server button */}
                <button
                    onClick={() => setCreateOpen(true)}
                    aria-label="Crear servidor"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated text-fg-primary transition-all hover:rounded-xl hover:bg-primary hover:text-white"
                >
                    <Icon name="Plus" size={20} />
                </button>

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
            <UserSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            <ServerCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
        </>
    );
}
