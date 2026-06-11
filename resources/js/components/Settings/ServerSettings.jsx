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
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'invites', label: 'Invites' },
];

export default function ServerSettings({ server }) {
    const [tab, setTab] = useState('overview');

    return (
        <div className="space-y-6">
            <nav className="flex gap-1 border-b border-deep-space-700" aria-label="Server settings tabs">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        aria-current={tab === t.id ? 'page' : undefined}
                        className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                            tab === t.id
                                ? 'border-primary text-fg'
                                : 'border-transparent text-fg-muted hover:text-fg'
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
            setError(err?.response?.data?.message ?? 'Failed to save server settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-card border border-deep-space-600 bg-deep-space-800 p-6">
            <h2 className="font-display text-lg font-semibold text-fg">Overview</h2>
            <p className="mt-1 text-sm text-fg-muted">Rename, rebrand, or describe this server.</p>

            <div className="mt-6 grid gap-4">
                <FormField label="Name" htmlFor="server-name">
                    <input
                        id="server-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={64}
                        className="w-full rounded-button border border-deep-space-600 bg-deep-space-700 px-3 py-2 text-sm text-fg focus:border-primary focus:outline-none"
                    />
                </FormField>
                <FormField label="Icon URL" htmlFor="server-icon" hint="Square image, 256×256 recommended.">
                    <input
                        id="server-icon"
                        type="url"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        placeholder="https://example.com/icon.png"
                        className="w-full rounded-button border border-deep-space-600 bg-deep-space-700 px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-primary focus:outline-none"
                    />
                </FormField>
                <FormField label="Description" htmlFor="server-desc" hint="Up to 1000 characters.">
                    <textarea
                        id="server-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="w-full resize-y rounded-button border border-deep-space-600 bg-deep-space-700 px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-primary focus:outline-none"
                    />
                </FormField>
            </div>

            <footer className="mt-6 flex items-center justify-between gap-4">
                <div>
                    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                    {saved && !error && <p className="text-sm text-success">Saved.</p>}
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save changes'}
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
        if (!window.confirm(`Remove ${member.display_name || member.name} from this server?`)) return;
        setActing(member.id);
        setError(null);
        try {
            await window.axios.delete(`/api/servers/${server.id}/members/${member.id}`);
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'Failed to remove member.');
        } finally {
            setActing(null);
        }
    };

    const handleBan = async (member) => {
        if (!window.confirm(`Ban ${member.display_name || member.name}? They will not be able to rejoin with the same invite.`)) return;
        setActing(member.id);
        setError(null);
        try {
            await window.axios.post(`/api/servers/${server.id}/bans`, { user_id: member.id });
            router.reload({ only: ['server'] });
        } catch (err) {
            // The ban endpoint may not exist yet — surface the error
            // honestly so the operator knows.
            setError(err?.response?.data?.message ?? 'Failed to ban member.');
        } finally {
            setActing(null);
        }
    };

    return (
        <section className="rounded-card border border-deep-space-600 bg-deep-space-800 p-6">
            <header className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-fg">Members</h2>
                <span className="text-xs text-fg-subtle">{members.length} total</span>
            </header>

            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

            <ul className="mt-4 divide-y divide-deep-space-700">
                {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 py-3">
                        <UserAvatar user={member} size="sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">
                                {member.display_name || member.name}
                            </p>
                            <p className="truncate text-xs text-fg-subtle">@{member.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleKick(member)}
                                disabled={acting === member.id}
                                className="rounded-button border border-deep-space-600 bg-deep-space-700 px-3 py-1 text-xs text-fg-muted hover:bg-deep-space-600 hover:text-fg disabled:opacity-50"
                            >
                                {acting === member.id ? 'Working…' : 'Kick'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBan(member)}
                                disabled={acting === member.id}
                                className="rounded-button border border-danger/40 bg-danger/10 px-3 py-1 text-xs text-danger hover:bg-danger/20 disabled:opacity-50"
                            >
                                Ban
                            </button>
                        </div>
                    </li>
                ))}
                {members.length === 0 && (
                    <li className="py-4 text-center text-sm text-fg-subtle">No members yet.</li>
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
            setError(err?.response?.data?.message ?? 'Failed to create invite.');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (invite) => {
        if (!window.confirm(`Revoke invite ${invite.code}?`)) return;
        try {
            await window.axios.delete(`/api/servers/${server.id}/invites/${invite.id}`);
            router.reload({ only: ['server'] });
        } catch (err) {
            setError(err?.response?.data?.message ?? 'Failed to revoke invite.');
        }
    };

    const fullUrl = newCode
        ? `${window.location.origin}/invites/${newCode}`
        : null;

    return (
        <section className="rounded-card border border-deep-space-600 bg-deep-space-800 p-6">
            <header className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-fg">Invites</h2>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="rounded-button bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-50"
                >
                    {creating ? 'Creating…' : 'New invite'}
                </button>
            </header>

            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

            {fullUrl && (
                <div className="mt-3 rounded-card border border-success/40 bg-success/10 p-3 text-sm">
                    <p className="text-success">Invite created.</p>
                    <code className="mt-1 block break-all text-fg">{fullUrl}</code>
                </div>
            )}

            <ul className="mt-4 divide-y divide-deep-space-700">
                {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-3 py-3">
                        <code className="flex-1 truncate rounded bg-deep-space-700 px-2 py-1 text-xs text-fg">
                            {invite.code}
                        </code>
                        <span className="text-xs text-fg-subtle">
                            {invite.uses ?? 0} / {invite.max_uses ?? '∞'}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleRevoke(invite)}
                            className="rounded-button border border-deep-space-600 bg-deep-space-700 px-3 py-1 text-xs text-fg-muted hover:bg-deep-space-600 hover:text-fg"
                        >
                            Revoke
                        </button>
                    </li>
                ))}
                {invites.length === 0 && (
                    <li className="py-4 text-center text-sm text-fg-subtle">No active invites.</li>
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
