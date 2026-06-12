import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/dev-register');
    };

    return (
        <>
            <Head title="Crear cuenta" />

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
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/30">
                            CA
                        </span>
                        <span className="font-display text-lg font-semibold tracking-tight">
                            Charlando-ando
                        </span>
                    </Link>

                    <div className="relative w-full rounded-card bg-gradient-to-b from-primary/30 via-deep-space-600/40 to-transparent p-px shadow-2xl shadow-primary/5">
                        <section className="rounded-card border border-deep-space-700/50 bg-deep-space-800/85 p-10 backdrop-blur-sm">
                            <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
                                Crear tu cuenta
                            </h1>
                            <p className="mt-2 text-sm text-fg-muted">
                                Registro rápido para desarrollo local. Sin OAuth.
                            </p>

                            {errors.email && (
                                <div
                                    role="alert"
                                    className="mt-5 rounded-card border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                                >
                                    {errors.email}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-8 space-y-5">
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-xs font-semibold uppercase tracking-wider text-fg-muted"
                                    >
                                        Nombre para mostrar
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        maxLength={32}
                                        autoComplete="nickname"
                                        className="mt-2 block w-full rounded-button border border-deep-space-600 bg-deep-space-900 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="Tu nombre"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-danger">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-semibold uppercase tracking-wider text-fg-muted"
                                    >
                                        Correo electrónico
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="mt-2 block w-full rounded-button border border-deep-space-600 bg-deep-space-900 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="tu@correo.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-danger">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold uppercase tracking-wider text-fg-muted"
                                    >
                                        Contraseña
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        className="mt-2 block w-full rounded-button border border-deep-space-600 bg-deep-space-900 px-3 py-2.5 text-sm text-fg placeholder-fg-subtle transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-danger">{errors.password}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-button bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-px hover:bg-primary-hover hover:shadow-primary/40 active:translate-y-0 active:bg-primary-active disabled:translate-y-0 disabled:opacity-50"
                                >
                                    {processing ? 'Creando...' : 'Crear cuenta'}
                                </button>
                            </form>
                        </section>
                    </div>

                    <p className="mt-8 text-sm text-fg-subtle">
                        ¿Ya tienes cuenta?{' '}
                        <Link
                            href="/dev-login"
                            className="text-primary transition-colors hover:text-primary-hover"
                        >
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </main>
        </>
    );
}
