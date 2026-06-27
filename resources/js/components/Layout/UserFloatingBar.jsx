// Floating user card fixed to the bottom-left corner of the screen.
// Always visible regardless of which page or scroll position.
// Overlays all content like Discord's bottom-left user panel.

import { Link, usePage } from '@inertiajs/react';
import UserAvatar from '../Presence/UserAvatar';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

export default function UserFloatingBar() {
    const page = usePage();
    const user = page.props?.auth?.user ?? null;

    const status = user?.status ?? 'offline';
    const statusLabel =
        {
            online: 'En línea',
            idle: 'Ausente',
            dnd: 'No molestar',
            offline: 'Invisible',
        }[status] ?? 'Invisible';

    const handleLogout = async () => {
        try {
            await window.axios.post('/logout');
        } catch {
            /* ignore */
        }
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('current_user');
        window.location.href = '/';
    };

    return (
        <div className="fixed bottom-0 left-0 z-50">
            {user ? (
                <div className="glass flex h-14 w-[240px] items-center gap-2 border-t border-white/10 px-3">
                    <Link
                        href="/settings"
                        className="flex items-center gap-2 overflow-hidden rounded-md px-1 py-1 text-xs text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg-primary flex-1 min-w-0"
                    >
                        <UserAvatar user={user} size="sm" showPresence />
                        <div className="flex min-w-0 flex-col items-start overflow-hidden">
                            <span className="truncate font-display text-sm font-semibold text-fg-primary">
                                {user.display_name || user.name}
                            </span>
                            <span className="text-caption text-fg-tertiary">{statusLabel}</span>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                        className="shrink-0 rounded-md p-1.5 text-fg-tertiary transition-colors hover:bg-red-500/10 hover:text-danger"
                    >
                        <Icon name="LogOut" size={16} />
                    </button>
                </div>
            ) : (
                <div className="glass flex h-14 w-[240px] items-center justify-center border-t border-white/10 px-3">
                    <Link href="/login">
                        <Button variant="primary" size="sm">Iniciar sesión</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
