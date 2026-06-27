// /settings/server/{server} — per-server settings surface. Renders the
// ServerSettings panel inside the same chrome as the user-level page
// (sidebar nav with the active server highlighted).

import { Head, Link, usePage } from '@inertiajs/react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import UserFloatingBar from '../../components/Layout/UserFloatingBar';
import ServerSettings from '../../components/Settings/ServerSettings';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';

export default function SettingsServerShow({ server, servers = [] }) {
    const { auth } = usePage().props;

    if (!auth || server.owner_id !== auth.user.id) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-surface-base text-fg">
                <p className="text-fg-muted">No tienes permisos para ver esta configuración.</p>
            </div>
        );
    }

    return (
        <>
            <Head title={`${server?.name ?? 'Servidor'} — Configuración`} />

            <div className="flex h-screen w-screen overflow-hidden bg-surface-base text-fg">
                <ServerSidebar servers={servers} activeServerId={server?.id} />

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
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-fg-muted transition-all duration-200 [transition-timing-function:var(--spring-standard)] hover:bg-surface-hover hover:text-fg"
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
                                    {servers.map((s) => (
                                        <li key={s.id}>
                                            <Link
                                                href={`/settings/server/${s.id}`}
                                                aria-current={String(s.id) === String(server?.id) ? 'page' : undefined}
                                                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 [transition-timing-function:var(--spring-standard)] ${
                                                    String(s.id) === String(server?.id)
                                                        ? 'bg-surface-hover text-fg'
                                                        : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                                                }`}
                                            >
                                                {s.icon_url ? (
                                                    <img
                                                        src={s.icon_url}
                                                        alt=""
                                                        className="h-6 w-6 shrink-0 rounded-md object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <span className="h-6 w-6 shrink-0 rounded-md bg-surface-hover" />
                                                )}
                                                <span className="truncate">{s.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <div className="mt-4 px-3">
                            <Link href={`/chat/${server?.id ?? ''}`} className="block">
                                <Button variant="secondary" size="sm" className="w-full">Volver al chat</Button>
                            </Link>
                        </div>
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-3xl">
                        <header className="mb-6">
                            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
                                {server?.name}
                            </h2>
                            <p className="mt-1 text-sm text-fg-muted">
                                Administra miembros, roles e invitaciones de este servidor.
                            </p>
                        </header>
                        <ServerSettings server={server} />
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
