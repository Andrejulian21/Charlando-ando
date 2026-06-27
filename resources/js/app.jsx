import axios from 'axios';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

// Configure axios for the SPA: send cookies with every request
// and auto-send the XSRF-TOKEN as X-XSRF-TOKEN header (Laravel's
// default CSRF protection for SPAs reading the encrypted cookie).
window.axios = axios.create({
    headers: {
        common: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    },
    withCredentials: true,
    withXSRFToken: true,
});

createInertiaApp({
    title: (title) => (title ? `${title} — Charlando-ando` : 'Charlando-ando'),
    resolve: (name) => {
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
