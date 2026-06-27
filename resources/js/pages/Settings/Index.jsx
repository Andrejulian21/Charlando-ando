// User-level settings. Renders the UserSettings panel and (if the user
// belongs to any servers) a list of quick-links to each server's
// per-server settings page. Tabs are managed at the Inertia level —
// /settings and /settings/server/{id} are separate routes.

import { Head, Link } from '@inertiajs/react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import UserFloatingBar from '../../components/Layout/UserFloatingBar';
import UserSettings from '../../components/Settings/UserSettings';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';

export default function SettingsIndex({ user, servers = [] }) {
    return (
        <>
            <Head title="Configuración" />

            <div className="flex h-screen w-screen overflow-hidden bg-surface-base text-fg">
                <ServerSidebar servers={servers} />

                <aside
                    aria-label="Navegación de configuración"
                    className="flex w-64 shrink-0 flex-col border-r border-border/50 glass"
                >
                    <header className="flex h-14 items-center border-b border-border px-4">
                        <h1 className="font-display text-sm font-semibold text-fg">Configuración</h1>
                    </header>
                    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Pestañas de configuración">
                        <ul className="space-y-0.5">
                            <li>
                                <Link
                                    href="/settings"
                                    aria-current="page"
                                    className="flex items-center gap-2 rounded-md bg-surface-hover px-3 py-2 text-sm font-medium text-fg transition-all duration-200 [transition-timing-function:var(--spring-standard)]"
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
                                    {servers
                                        .filter((server) => user.id === server.owner_id)
                                        .map((server) => (
                                            <li key={server.id}>
                                                <Link
                                                    href={`/settings/server/${server.id}`}
                                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted transition-all duration-200 [transition-timing-function:var(--spring-standard)] hover:bg-surface-hover hover:text-fg"
                                                >
                                                    {server.icon_url ? (
                                                        <img
                                                            src={server.icon_url}
                                                            alt=""
                                                            className="h-6 w-6 shrink-0 rounded-md object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span className="h-6 w-6 shrink-0 rounded-md bg-surface-hover" />
                                                    )}
                                                    <span className="truncate">{server.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                </ul>
                            </>
                        )}

                        <div className="mt-4 px-3">
                            <Link href="/chat" className="block">
                                <Button variant="secondary" size="sm" className="w-full">Volver al chat</Button>
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
            <UserFloatingBar />
        </>
    );
}

function SettingsIcon() {
    return <Icon name="Settings" size={16} className="opacity-80" />;
}
