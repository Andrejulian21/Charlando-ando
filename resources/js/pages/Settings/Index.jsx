// User-level settings. Renders the UserSettings panel and (if the user
// belongs to any servers) a list of quick-links to each server's
// per-server settings page. Tabs are managed at the Inertia level —
// /settings and /settings/server/{id} are separate routes.

import { Head, Link } from '@inertiajs/react';
import UserSettings from '../../components/Settings/UserSettings';

export default function SettingsIndex({ user, servers = [] }) {
    return (
        <>
            <Head title="Configuración" />

            <div className="flex h-screen w-screen overflow-hidden bg-deep-space-900 text-fg">
                <aside
                    aria-label="Navegación de configuración"
                    className="flex w-64 shrink-0 flex-col border-r border-deep-space-700 bg-deep-space-800"
                >
                    <header className="flex h-14 items-center border-b border-deep-space-700 px-4">
                        <h1 className="font-display text-sm font-semibold text-fg">Configuración</h1>
                    </header>
                    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Pestañas de configuración">
                        <ul className="space-y-0.5">
                            <li>
                                <Link
                                    href="/settings"
                                    aria-current="page"
                                    className="flex items-center gap-2 rounded-md bg-deep-space-600 px-3 py-2 text-sm font-medium text-fg"
                                >
                                    <SettingsIcon />
                                    Mi cuenta
                                </Link>
                            </li>
                        </ul>

                        {servers.length > 0 && (
                            <>
                                <h2 className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                                    Servidores
                                </h2>
                                <ul className="mt-1 space-y-0.5">
                                    {servers.map((server) => (
                                        <li key={server.id}>
                                            <Link
                                                href={`/settings/server/${server.id}`}
                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-deep-space-700 hover:text-fg"
                                            >
                                                <span className="h-6 w-6 shrink-0 rounded-md bg-deep-space-600" />
                                                <span className="truncate">{server.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <div className="mt-4 px-3">
                            <Link
                                href="/chat"
                                className="block rounded-button bg-deep-space-700 px-3 py-2 text-center text-xs text-fg-muted hover:bg-deep-space-600 hover:text-fg"
                            >
                                Volver al chat
                            </Link>
                        </div>
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-3xl">
                        <header className="mb-6">
                            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">Mi cuenta</h2>
                            <p className="mt-1 text-sm text-fg-muted">
                                Actualiza tu perfil, avatar y estado de presencia.
                            </p>
                        </header>
                        <UserSettings user={user} />
                    </div>
                </main>
            </div>
        </>
    );
}

function SettingsIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current opacity-80">
            <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106A1.53 1.53 0 0 1 3.17 8.51c-1.56.38-1.56 2.6 0 2.98a1.53 1.53 0 0 1 .948 2.287c-.836 1.372.734 2.942 2.106 2.106A1.53 1.53 0 0 1 8.51 16.83c.38 1.56 2.6 1.56 2.98 0a1.53 1.53 0 0 1 2.287-.948c1.372.836 2.942-.734 2.106-2.106a1.53 1.53 0 0 1 .948-2.286c1.56-.38 1.56-2.6 0-2.98a1.53 1.53 0 0 1-.948-2.287c.836-1.372-.734-2.942-2.106-2.106A1.53 1.53 0 0 1 11.49 3.17zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        </svg>
    );
}
