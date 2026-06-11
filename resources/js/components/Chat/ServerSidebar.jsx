// Vertical strip of server icons on the far left. Each entry is either the
// server's icon (if it has an icon_url) or the first letter of its name
// against a deterministic hue. The active server gets a rounded accent
// "pill" behind it — same affordance as the reference design.

import { Link } from '@inertiajs/react';

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
    return (
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
    );
}
