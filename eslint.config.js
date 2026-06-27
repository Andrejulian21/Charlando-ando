import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';

export default [
    js.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        files: ['resources/js/**/*.{js,jsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'warn',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        ignores: ['vendor/', 'node_modules/', 'public/', 'coverage/'],
    },
];
