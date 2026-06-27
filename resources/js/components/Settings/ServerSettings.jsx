// Per-server settings panel. Three sub-tabs in a single screen:
//   1. Overview — rename the server, change icon, edit description
//   2. Members  — list members with a kick/ban affordance
//   3. Invites  — list active invite codes with a "create" form
//
// Roles are read-only here for now — the dedicated role-management UI
// will land in a follow-up PR. We surface the role list as informational
// badges so the user can see who has what.

import { useState } from 'react';
import UserAvatar from '../Presence/UserAvatar';
import { router } from '@inertiajs/react';

const TABS = [
    { id: 'overview', label: 'General' },
    { id: 'members', label: 'Miembros' },
    { id: 'invites', label: 'Invitaciones' },
];

export default function ServerSettings({ server }) {
    const [tab, setTab] = useState('overview');

    return (
        <div className="space-y-6">
            <nav
                className="flex gap-1 border-b border-border"
                aria-label="Pestañas de configuración del servidor"
            >
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        aria-current={tab === t.id ? 'page' : undefined}
                        className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-all duration-200 [transition-timing-function:var(--spring-standard)] ${
                            tab === t.id ? 'border-primary text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>

            {tab === 'overview' && <OverviewTab server={server} />}
            {tab === 'members' && <MembersTab server={server} />}
            {tab === 'invites' && <InvitesTab server={server} />}
        </div>
    );
}

function OverviewTab({ server }) {
    const [name, setName] = useState(server?.name ?? '');
    const [iconUrl, setIconUrl] = useState(server?.icon_url ?? '');
    const [description, setDescription] = useState(server?.description ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await window.axios.patch(`/api/servers/${server.id}`, {
                name,
                icon_url: iconUrl || null,
                description: description || null,
            });
            setSaved(true);
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudieron guardar los ajustes del servidor.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="glass rounded-xl p-6"
        >
            <h2 className="font-display text-lg font-semibold text-fg">General</h2>
            <p className="mt-1 text-sm text-fg-muted">Renombra, redecora o describe este servidor.</p>

            <div className="mt-6 grid gap-4">
                <FormField label="Nombre" htmlFor="server-name">
                    <input
                        id="server-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={64}
                        className="w-full rounded-md border border-surface-hover bg-surface-base px-3 py-2 text-sm text-fg transition-colors focus:border-primary focus:outline-none"
                    />
                </FormField>
                <FormField label="URL del ícono" htmlFor="server-icon" hint="Imagen cuadrada, se recomienda 256×256.">
                    <input
                        id="server-icon"
                        type="url"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        placeholder="https://ejemplo.com/icono.png"
                        className="w-full rounded-md border border-surface-hover bg-surface-base px-3 py-2 text-sm text-fg placeholder-fg-subtle transition-colors focus:border-primary focus:outline-none"
                    />
                </FormField>
                <FormField label="Descripción" htmlFor="server-desc" hint="Hasta 1000 caracteres.">
                    <textarea
                        id="server-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="w-full resize-y rounded-md border border-surface-hover bg-surface-base px-3 py-2 text-sm text-fg placeholder-fg-subtle transition-colors focus:border-primary focus:outline-none"
                    />
                </FormField>
            </div>

            <footer className="mt-6 flex items-center justify-between gap-4">
                <div>
                    {error && (
                        <p role="alert" className="text-sm text-danger">
                            {error}
                        </p>
                    )}
                    {saved && !error && <p className="text-sm text-success">Guardado.</p>}
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-px hover:bg-primary-hover hover:shadow-primary/40 active:translate-y-0 active:bg-primary-active disabled:translate-y-0 disabled:opacity-50"
                >
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
            </footer>
        </form>
    );
}

function MembersTab({ server }) {
    const [acting, setActing] = useState(null);
    const [error, setError] = useState(null);

    const members = server?.members ?? [];

    const handleKick = async (member) => {
        if (!window.confirm(`¿Expulsar a ${member.display_name || member.name} de este servidor?`)) return;
        setActing(member.id);
        setError(null);
        try {
            await window.axios.delete(`/api/servers/${server.id}/members/${member.id}`);
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo expulsar al miembro.');
        } finally {
            setActing(null);
        }
    };

    const handleBan = async (member) => {
        if (
            !window.confirm(
                `¿Banear a ${member.display_name || member.name}? No podrá volver a unirse con la misma invitación.`,
            )
        )
            return;
        setActing(member.id);
        setError(null);
        try {
            await window.axios.post(`/api/servers/${server.id}/bans`, { user_id: member.id });
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo banear al miembro.');
        } finally {
            setActing(null);
        }
    };

    return (
        <section className="glass rounded-xl p-6">
            <header className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-fg">Miembros</h2>
                <span className="text-xs text-fg-subtle">{members.length} en total</span>
            </header>

            {error && (
                <p role="alert" className="mt-3 text-sm text-danger">
                    {error}
                </p>
            )}

            <ul className="mt-4 divide-y divide-border">
                {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 py-3">
                        <UserAvatar user={member} size="sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">{member.display_name || member.name}</p>
                            <p className="truncate text-xs text-fg-subtle">@{member.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleKick(member)}
                                disabled={acting === member.id}
                                className="rounded-md border border-surface-hover bg-surface-elevated px-3 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg disabled:opacity-50"
                            >
                                {acting === member.id ? 'Procesando…' : 'Expulsar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBan(member)}
                                disabled={acting === member.id}
                                className="rounded-md border border-danger/40 bg-danger/10 px-3 py-1 text-xs text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                            >
                                Banear
                            </button>
                        </div>
                    </li>
                ))}
                {members.length === 0 && (
                    <li className="py-4 text-center text-sm text-fg-subtle">Aún no hay miembros.</li>
                )}
            </ul>
        </section>
    );
}

function InvitesTab({ server }) {
    const invites = server?.invites ?? [];
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [newCode, setNewCode] = useState(null);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        setNewCode(null);
        try {
            const response = await window.axios.post(`/api/servers/${server.id}/invites`);
            const data = response.data?.data;
            setNewCode(data?.code ?? '');
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo crear la invitación.');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (invite) => {
        if (!window.confirm(`¿Revocar la invitación ${invite.code}?`)) return;
        try {
            await window.axios.delete(`/api/servers/${server.id}/invites/${invite.id}`);
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'No se pudo revocar la invitación.');
        }
    };

    const fullUrl = newCode ? `${window.location.origin}/invites/${newCode}` : null;

    return (
        <section className="glass rounded-xl p-6">
            <header className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-fg">Invitaciones</h2>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-px hover:bg-primary-hover hover:shadow-primary/40 active:translate-y-0 active:bg-primary-active disabled:translate-y-0 disabled:opacity-50"
                >
                    {creating ? 'Creando…' : 'Nueva invitación'}
                </button>
            </header>

            {error && (
                <p role="alert" className="mt-3 text-sm text-danger">
                    {error}
                </p>
            )}

            {fullUrl && (
                <div className="mt-3 rounded-md border border-success/40 bg-success/10 p-3 text-sm">
                    <p className="text-success">Invitación creada.</p>
                    <code className="mt-1 block break-all text-fg">{fullUrl}</code>
                </div>
            )}

            <ul className="mt-4 divide-y divide-border">
                {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-3 py-3">
                        <code className="flex-1 truncate rounded bg-surface-elevated px-2 py-1 text-xs text-fg">
                            {invite.code}
                        </code>
                        <span className="text-xs text-fg-subtle">
                            {invite.uses ?? 0} / {invite.max_uses ?? '∞'}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleRevoke(invite)}
                            className="rounded-md border border-surface-hover bg-surface-elevated px-3 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                        >
                            Revocar
                        </button>
                    </li>
                ))}
                {invites.length === 0 && (
                    <li className="py-4 text-center text-sm text-fg-subtle">No hay invitaciones activas.</li>
                )}
            </ul>
        </section>
    );
}

function FormField({ label, htmlFor, hint, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-fg-muted">
                {label}
            </label>
            <div className="mt-1">{children}</div>
            {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
        </div>
    );
}
