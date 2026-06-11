import { Head, Link } from '@inertiajs/react';

const FEATURES = [
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .857.422 1.614 1.062 2.062a2.126 2.126 0 0 0 .476.095 48.64 48.64 0 0 0 8.048 0c1.131-.094 1.976-1.057 1.976-2.192v-4.286" />
            </svg>
        ),
        title: 'Chat en tiempo real',
        desc: 'Mensajes instantáneos por WebSocket. Sin recargas, sin esperas.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
        ),
        title: 'Servidores y canales',
        desc: 'Organiza las conversaciones a tu manera. Crea servidores, suma canales e invita a tu equipo.',
    },
    {
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-2.332 9-7.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
        title: 'Permisos por rol',
        desc: 'Propietarios, administradores, moderadores y miembros. Control detallado en cada canal.',
    },
];

export default function Welcome({ appName = 'Charlando-ando', canLogin = false }) {
    return (
        <>
            <Head title={appName} />

            <div className="relative min-h-screen bg-deep-space-900 text-fg">
                {/* Ambient gradient */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,93,211,0.22)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.10)_0%,transparent_50%)]"
                />

                {/* Navbar */}
                <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-white shadow-md shadow-primary/30">
                            CA
                        </div>
                        <span className="font-display text-lg font-semibold tracking-tight">{appName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {canLogin && (
                            <Link
                                href="/login"
                                className="rounded-button bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-px hover:bg-primary-hover hover:shadow-primary/40 active:translate-y-0 active:bg-primary-active"
                            >
                                Iniciar sesión
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Hero */}
                <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-24 text-center sm:pt-32">
                    <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tighter text-balance md:text-6xl lg:text-7xl">
                        Conversaciones que se sienten{' '}
                        <span className="bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">
                            instantáneas
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
                        Una plataforma de chat en tiempo real inspirada en Discord. Organiza a tu equipo,
                        controla tus datos y no vuelvas a perderte un mensaje.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/login"
                            className="rounded-button bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/40 active:translate-y-0 active:bg-primary-active"
                        >
                            Empezar ahora →
                        </Link>
                    </div>
                </section>

                {/* Features */}
                <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
                    <div className="grid gap-8 sm:grid-cols-3">
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className="group relative overflow-hidden rounded-card border border-deep-space-700/60 bg-deep-space-800/70 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-deep-space-800/90 hover:shadow-xl hover:shadow-primary/5"
                            >
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                                />
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                                    {f.icon}
                                </div>
                                <h3 className="font-display text-base font-semibold text-fg">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative z-10 border-t border-deep-space-700/60 py-8 text-center text-xs text-fg-subtle">
                    &copy; {new Date().getFullYear()} {appName}. Plataforma de chat de código abierto.
                </footer>
            </div>
        </>
    );
}
