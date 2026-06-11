// User settings panel — display name, avatar URL, and presence status.
// Saves via PATCH /api/me. The status dropdown is the same set as the
// User model constants; "invisible" is included even though the user
// will appear offline in other tabs.

import { useEffect, useState } from 'react';
import UserAvatar from '../Presence/UserAvatar';
import { setStatus as setSocketStatus } from '../../echo';
import { useChatStore } from '../../stores/useChatStore';

const STATUSES = [
    { value: 'online', label: 'Online', description: 'You appear as available.' },
    { value: 'idle', label: 'Idle', description: 'Yellow dot — you are away.' },
    { value: 'dnd', label: 'Do not disturb', description: 'Red dot — no pings please.' },
    { value: 'invisible', label: 'Invisible', description: 'Appear offline to others.' },
];

const NAME_MIN = 2;
const NAME_MAX = 32;
const AVATAR_MAX = 512;

export default function UserSettings({ user }) {
    const setCurrentUser = useChatStore((s) => s.setCurrentUser);

    const [displayName, setDisplayName] = useState(user?.display_name ?? '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
    const [status, setStatus] = useState(user?.status ?? 'online');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setDisplayName(user?.display_name ?? '');
        setAvatarUrl(user?.avatar_url ?? '');
        setStatus(user?.status ?? 'online');
    }, [user]);

    const trimmedName = displayName.trim();
    const nameError = trimmedName.length < NAME_MIN
        ? `Display name must be at least ${NAME_MIN} characters.`
        : trimmedName.length > NAME_MAX
            ? `Display name must be at most ${NAME_MAX} characters.`
            : null;
    const avatarError = avatarUrl && avatarUrl.length > AVATAR_MAX
        ? `Avatar URL is too long.`
        : null;
    const canSave = !saving && !nameError && !avatarError;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canSave) return;
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const payload = {
                display_name: trimmedName,
                avatar_url: avatarUrl || null,
                status,
            };
            const response = await window.axios.patch('/api/me', payload);
            const data = response.data?.data ?? payload;
            setCurrentUser({ ...user, ...data });
            // Push the new status over the socket so the sidecar broadcasts
            // it. The DB write alone won't trigger a WebSocket event.
            setSocketStatus(status);
            setSaved(true);
        } catch (err) {
            const validationErrors = err?.response?.data?.errors;
            if (validationErrors) {
                const firstField = Object.values(validationErrors)[0]?.[0];
                setError(firstField ?? 'Failed to save settings.');
            } else {
                setError(err?.response?.data?.message ?? 'Failed to save settings.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-card border border-deep-space-600 bg-deep-space-800 p-6">
                <h2 className="font-display text-lg font-semibold text-fg">Profile</h2>
                <p className="mt-1 text-sm text-fg-muted">
                    How you appear in servers and direct messages.
                </p>

                <div className="mt-6 flex items-center gap-4">
                    <UserAvatar
                        user={{ ...user, display_name: trimmedName, avatar_url: avatarUrl, status }}
                        size="xl"
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                        <Field
                            label="Display name"
                            htmlFor="display_name"
                            error={nameError}
                            hint={`${trimmedName.length} / ${NAME_MAX}`}
                        >
                            <input
                                id="display_name"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                maxLength={NAME_MAX + 1}
                                className={inputClass(nameError)}
                            />
                        </Field>
                        <Field
                            label="Avatar URL"
                            htmlFor="avatar_url"
                            error={avatarError}
                            hint="Square image works best. Leave blank for initials."
                        >
                            <input
                                id="avatar_url"
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/avatar.png"
                                className={inputClass(avatarError)}
                            />
                        </Field>
                    </div>
                </div>
            </section>

            <section className="rounded-card border border-deep-space-600 bg-deep-space-800 p-6">
                <h2 className="font-display text-lg font-semibold text-fg">Status</h2>
                <p className="mt-1 text-sm text-fg-muted">
                    Set how you appear to other members. Idle is automatic after 5 minutes of inactivity.
                </p>

                <fieldset className="mt-4 space-y-2">
                    <legend className="sr-only">Presence status</legend>
                    {STATUSES.map((option) => (
                        <label
                            key={option.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-card border px-3 py-2 transition-colors ${
                                status === option.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-deep-space-600 bg-deep-space-700 hover:border-deep-space-500'
                            }`}
                        >
                            <input
                                type="radio"
                                name="status"
                                value={option.value}
                                checked={status === option.value}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 h-4 w-4 accent-primary"
                            />
                            <span>
                                <span className="block text-sm font-medium text-fg">{option.label}</span>
                                <span className="block text-xs text-fg-muted">{option.description}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
            </section>

            <footer className="flex items-center justify-between gap-4">
                <div>
                    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                    {saved && !error && <p className="text-sm text-success">Saved.</p>}
                </div>
                <button
                    type="submit"
                    disabled={!canSave}
                    className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
            </footer>
        </form>
    );
}

function Field({ label, htmlFor, hint, error, children }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-fg-muted">
                {label}
            </label>
            <div className="mt-1">{children}</div>
            {error ? (
                <p role="alert" className="mt-1 text-xs text-danger">{error}</p>
            ) : hint ? (
                <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
            ) : null}
        </div>
    );
}

function inputClass(error) {
    return [
        'w-full rounded-button border bg-deep-space-700 px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:outline-none',
        error ? 'border-danger focus:border-danger' : 'border-deep-space-600 focus:border-primary',
    ].join(' ');
}
