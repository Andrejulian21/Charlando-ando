import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    title: (title) => (title ? `${title} — Charlando-ando` : 'Charlando-ando'),
    resolve: (name) => {
        // Lazy-load page components on demand to keep the initial bundle small.
        const pages = import.meta.glob('./pages/**/*.jsx', { eager: false });
        const loader = pages[`./pages/${name}.jsx`];
        if (!loader) {
            throw new Error(`Inertia page not found: ${name}`);
        }
        return loader();
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#6C5DD3',
    },
});
