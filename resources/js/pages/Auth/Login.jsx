// Google OAuth landing page. The user clicks the button, the browser
// navigates to /auth/google/redirect, the provider bounces them back to
// /auth/google/callback, and the Inertia Callback page takes it from
// there. We intentionally avoid using fetch/XHR here so the user is
// fully moved into the post-auth flow by the browser.

import { Head, Link } from '@inertiajs/react';

const PROVIDERS = [
    { id: 'google', label: 'Continue with Google', color: 'bg-white text-deep-space-900 hover:bg-slate-100' },
    { id: 'github', label: 'Continue with GitHub', color: 'bg-deep-space-700 text-fg hover:bg-deep-space-600 border border-deep-space-500' },
    { id: 'discord', label: 'Continue with Discord', color: 'bg-deep-space-700 text-fg hover:bg-deep-space-600 border border-deep-space-500' },
];

export default function Login({ errors = {}, appName = 'Charlando-ando' }) {
    const oauthError = errors.oauth;

    return (
        <>
            <Head title="Sign in" />

            <main className="relative min-h-screen overflow-hidden bg-deep-space-900">
                {/* Ambient glow — purely decorative, mirrors the design screenshots. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(108,93,211,0.18),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_60%)]"
                />

                <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
                    <Link href="/" className="mb-8 inline-flex items-center gap-2 text-fg-muted hover:text-fg">
                        <span className="grid h-9 w-9 place-items-center rounded-card bg-primary text-sm font-bold text-white">CA</span>
                        <span className="font-display text-base font-semibold tracking-tight">{appName}</span>
                    </Link>

                    <section className="w-full rounded-card border border-deep-space-600 bg-deep-space-800 p-8 shadow-xl">
                        <h1 className="font-display text-2xl font-semibold text-fg">Welcome back</h1>
                        <p className="mt-2 text-sm text-fg-muted">
                            Pick a provider to continue. We never see your password.
                        </p>

                        {oauthError && (
                            <div
                                role="alert"
                                className="mt-4 rounded-card border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                            >
                                {oauthError}
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            {PROVIDERS.map((provider) => (
                                <a
                                    key={provider.id}
                                    href={`/auth/${provider.id}/redirect`}
                                    className={`flex w-full items-center justify-center gap-2 rounded-button px-4 py-2.5 text-sm font-medium transition-colors ${provider.color}`}
                                >
                                    <ProviderIcon id={provider.id} />
                                    {provider.label}
                                </a>
                            ))}
                        </div>

                        <p className="mt-6 text-xs text-fg-subtle">
                            By continuing you agree to our terms of service and privacy policy.
                        </p>
                    </section>

                    <p className="mt-6 text-xs text-fg-subtle">
                        Trouble signing in? <a href="mailto:support@charlando.app" className="text-primary hover:text-primary-hover">Contact support</a>
                    </p>
                </div>
            </main>
        </>
    );
}

function ProviderIcon({ id }) {
    // Inline SVGs keep the bundle small and let us inherit `currentColor`
    // so the button controls the icon hue.
    if (id === 'google') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="#EA4335" d="M12 10.2v3.84h5.52c-.24 1.44-1.74 4.2-5.52 4.2-3.3 0-6-2.76-6-6.18s2.7-6.18 6-6.18c1.92 0 3.18.78 3.9 1.44l2.64-2.58C16.86 3.12 14.64 2.16 12 2.16 6.42 2.16 1.92 6.66 1.92 12.06S6.42 22 12 22c6.9 0 9.84-4.86 9.84-9.36 0-.66-.06-1.14-.18-1.62H12z" />
            </svg>
        );
    }
    if (id === 'github') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.8.4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
            </svg>
        );
    }
    if (id === 'discord') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M20.3 4.5a18 18 0 0 0-4.5-1.4l-.2.4a16.7 16.7 0 0 0-7.2 0l-.2-.4A18 18 0 0 0 3.7 4.5C1.1 8.4.4 12.2.7 16a18 18 0 0 0 5.5 2.8l.5-.7a11 11 0 0 1-1.8-.9l.4-.3a13 13 0 0 0 11.4 0l.4.3a11 11 0 0 1-1.8.9l.5.7a18 18 0 0 0 5.5-2.8c.4-4.5-.6-8.3-2.6-11.5zM8.6 14.1c-1 0-1.9-1-1.9-2.1 0-1.2.9-2.1 1.9-2.1s1.9 1 1.9 2.1-.9 2.1-1.9 2.1zm6.8 0c-1 0-1.9-1-1.9-2.1 0-1.2.9-2.1 1.9-2.1s1.9 1 1.9 2.1-.9 2.1-1.9 2.1z" />
            </svg>
        );
    }
    return null;
}
