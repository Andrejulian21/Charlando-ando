import { Head, Link } from '@inertiajs/react';

const PROVIDERS = [
    { id: 'google', label: 'Continuar con Google' },
    { id: 'github', label: 'Continuar con GitHub' },
];

export default function Login({ errors = {}, appName = 'Charlando-ando', devLogin = false }) {
    const oauthError = errors.oauth;

    return (
        <>
            <Head title="Iniciar sesión" />

            <main className="relative min-h-screen overflow-hidden bg-deep-space-900">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(108,93,211,0.18),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_60%)]"
                />

                <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
                    <Link
                        href="/"
                        className="mb-10 inline-flex items-center gap-2.5 text-fg-muted transition-colors hover:text-fg"
                    >
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30">
                            CA
                        </span>
                        <span className="font-display text-lg font-semibold tracking-tight">
                            {appName}
                        </span>
                    </Link>

                    <div className="relative w-full rounded-card bg-gradient-to-b from-primary/30 via-deep-space-600/40 to-transparent p-px shadow-2xl shadow-[0_0_60px_-15px_rgba(108,93,211,0.15)]">
                        <section className="rounded-card border border-deep-space-700/50 bg-deep-space-800/80 p-10 backdrop-blur-sm">
                            <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
                                Bienvenido de vuelta
                            </h1>
                            <p className="mt-2 text-base text-fg-muted">
                                Inicia sesión o crea una cuenta para continuar.
                            </p>

                            {oauthError && (
                                <div
                                    role="alert"
                                    className="mt-5 rounded-card border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                                >
                                    {oauthError}
                                </div>
                            )}

                            <div className="mt-8 space-y-3">
                                {PROVIDERS.map((provider) => (
                                    <a
                                        key={provider.id}
                                        href={`/auth/${provider.id}/redirect`}
                                        className="flex w-full items-center justify-center gap-2.5 rounded-button border border-deep-space-500 bg-deep-space-700 px-4 py-3 text-sm font-semibold text-fg shadow-lg shadow-deep-space-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-deep-space-600 active:translate-y-0"
                                    >
                                        <ProviderIcon id={provider.id} />
                                        {provider.label}
                                    </a>
                                ))}
                            </div>

                            {devLogin && (
                                <>
                                    <div className="my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                                        <span className="h-px flex-1 bg-deep-space-700" />
                                        <span>O</span>
                                        <span className="h-px flex-1 bg-deep-space-700" />
                                    </div>

                                    <div className="space-y-3">
                                        <Link
                                            href="/dev-login"
                                            className="flex w-full items-center justify-center gap-2 rounded-button bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-primary/40 active:translate-y-0 active:bg-primary-active"
                                        >
                                            Iniciar sesión con email
                                        </Link>
                                        <Link
                                            href="/dev-register"
                                            className="flex w-full items-center justify-center gap-2 rounded-button border border-deep-space-500 bg-deep-space-700/60 px-4 py-3 text-sm font-semibold text-fg transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-deep-space-600 active:translate-y-0"
                                        >
                                            Crear cuenta
                                        </Link>
                                    </div>
                                </>
                            )}

                            <p className="mt-7 text-xs text-fg-subtle">
                                Al continuar aceptas nuestros términos de servicio y política de privacidad.
                            </p>
                        </section>
                    </div>

                    <p className="mt-8 text-xs text-fg-subtle">
                        ¿Problemas para iniciar sesión?{' '}
                        <a
                            href="mailto:soporte@charlando.app"
                            className="text-primary transition-colors hover:text-primary-hover"
                        >
                            Contactar a soporte
                        </a>
                    </p>
                </div>
            </main>
        </>
    );
}

function ProviderIcon({ id }) {
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
    return null;
}
