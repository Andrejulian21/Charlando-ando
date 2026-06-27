import { Head, Link } from '@inertiajs/react';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

const FEATURES = [
    {
        icon: <Icon name="Zap" size={24} />,
        title: 'Chat en tiempo real',
        desc: 'Mensajes instantáneos por WebSocket. Sin recargas, sin esperas.',
    },
    {
        icon: <Icon name="Users" size={24} />,
        title: 'Servidores y canales',
        desc: 'Organiza las conversaciones a tu manera. Crea servidores, suma canales e invita a tu equipo.',
    },
    {
        icon: <Icon name="Shield" size={24} />,
        title: 'Permisos por rol',
        desc: 'Propietarios, administradores, moderadores y miembros. Control detallado en cada canal.',
    },
];

export default function Welcome({ appName = 'Charlando-ando', canLogin = false }) {
    return (
        <>
            <Head title={appName}>
                <link rel="icon" href="/icono.png" sizes="32x32" type="image/png" />
                <link rel="icon" href="/icono.png" sizes="64x64" type="image/png" />
                <link rel="apple-touch-icon" href="/icono.png" sizes="180x180" />
            </Head>

            <div className="relative min-h-screen bg-surface-base text-fg">
                {/* Ambient gradient */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,93,211,0.22)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.10)_0%,transparent_50%)]"
                />

                {/* Navbar */}
                <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <img src="/nombre_con_icono.png" alt={appName} className="h-12 w-auto" />
                    </Link>

                    <div className="flex items-center gap-3">
                        {canLogin && (
                            <Link href="/login">
                                <Button variant="primary" size="sm">Iniciar sesión</Button>
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
                        Una plataforma de chat en tiempo real inspirada en Discord. Organiza a tu equipo, controla tus
                        datos y no vuelvas a perderte un mensaje.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/login">
                            <Button variant="primary" size="lg">Empezar ahora →</Button>
                        </Link>
                    </div>
                </section>

                {/* Features */}
                <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
                    <div className="grid gap-8 sm:grid-cols-3">
                        {FEATURES.map((f, i) => (
                            <div
                                key={f.title}
                                className="double-bezel animate-[slide-up_300ms_var(--spring-gentle)_calc(var(--index)*100ms)_both]"
                                style={{ '--index': i }}
                            >
                                <div className="glass rounded-[calc(2rem-0.375rem)] p-7 transition-all duration-350 [transition-timing-function:var(--spring-overshoot)] hover:scale-[1.02] hover:-translate-y-1 hover:border-primary/30">
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
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative z-10 border-t border-border/60 py-8 text-center text-xs text-fg-subtle">
                    &copy; {new Date().getFullYear()} {appName}. Plataforma de chat de código abierto.
                </footer>
            </div>
        </>
    );
}
