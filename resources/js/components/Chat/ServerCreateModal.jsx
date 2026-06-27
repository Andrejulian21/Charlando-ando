// Server creation modal. User enters server name and up to 4 channel names.
// On submit, POSTs to /api/servers with the server details and creates
// channels via subsequent API calls, then navigates to the new server.

import { useState } from 'react';
import { router } from '@inertiajs/react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

const MAX_CHANNELS = 4;

export default function ServerCreateModal({ isOpen, onClose }) {
    const [name, setName] = useState('');
    const [channels, setChannels] = useState([{ name: '' }]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [isPublic, setIsPublic] = useState(true);

    const addChannel = () => {
        if (channels.length >= MAX_CHANNELS) return;
        setChannels([...channels, { name: '' }]);
    };

    const removeChannel = (index) => {
        setChannels(channels.filter((_, i) => i !== index));
    };

    const updateChannel = (index, value) => {
        const updated = [...channels];
        updated[index] = { name: value };
        setChannels(updated);
    };

    function sanitizeChannelName(raw) {
        return raw
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        setError(null);
        try {
            const res = await window.axios.post('/api/servers', { name: name.trim(), is_public: isPublic });
            const serverId = res.data.data.id;

            // Create each channel (skip 'general' since the backend already creates it)
            for (const ch of channels) {
                const chName = sanitizeChannelName(ch.name);
                if (!chName || chName === 'general') continue;
                await window.axios.post(`/api/servers/${serverId}/channels`, {
                    name: chName,
                    type: 'text',
                });
            }

            onClose();
            router.visit(`/chat/${serverId}`, { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || 'No se pudo crear el servidor.');
            setCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear servidor">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Server name */}
                <Input
                    label="Nombre del servidor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del servidor"
                    disabled={creating}
                    maxLength={100}
                />

                {/* Public/Private toggle */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">Tipo de servidor</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsPublic(true)}
                            className={`flex-1 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 [transition-timing-function:var(--spring-standard)] active:scale-[0.97] ${
                                isPublic
                                    ? 'glass border-primary/40 text-fg-primary shadow-sm shadow-primary/10'
                                    : 'glass border-white/5 text-fg-secondary hover:text-fg-primary hover:border-white/10'
                            }`}
                        >
                            <span className="block font-medium">Público</span>
                            <span className="block text-[10px] opacity-70 mt-0.5">Cualquier persona puede unirse</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPublic(false)}
                            className={`flex-1 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 [transition-timing-function:var(--spring-standard)] active:scale-[0.97] ${
                                !isPublic
                                    ? 'glass border-primary/40 text-fg-primary shadow-sm shadow-primary/10'
                                    : 'glass border-white/5 text-fg-secondary hover:text-fg-primary hover:border-white/10'
                            }`}
                        >
                            <span className="block font-medium">Privado</span>
                            <span className="block text-[10px] opacity-70 mt-0.5">Solo por invitación</span>
                        </button>
                    </div>
                </div>

                {/* Channels */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">Canales adicionales</span>
                            <span className="text-[10px] text-fg-tertiary">
                                {channels.length}/{MAX_CHANNELS}
                            </span>
                        </div>
                        <p className="text-[10px] text-fg-tertiary -mt-1">Se usa minúsculas y guiones (ej: off-topic). El canal "general" se crea automáticamente.</p>

                    <div className="flex flex-col gap-1.5">
                        {channels.map((channel, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={channel.name}
                                    onChange={(e) => updateChannel(index, e.target.value)}
                                    placeholder="Nombre del canal"
                                    disabled={creating}
                                    maxLength={100}
                                    className="glass flex-1 rounded-xl border-transparent px-3 py-2 text-sm text-fg-primary placeholder-fg-tertiary transition-all duration-200 [transition-timing-function:var(--spring-standard)] focus:ring-1 focus:ring-white/10 focus:outline-none disabled:opacity-50"
                                />
                                {channels.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeChannel(index)}
                                        disabled={creating}
                                        aria-label="Eliminar canal"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass text-fg-tertiary transition-all duration-200 [transition-timing-function:var(--spring-standard)] hover:border-danger/40 hover:text-danger active:scale-[0.92] disabled:opacity-50"
                                    >
                                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {channels.length < MAX_CHANNELS && (
                        <button
                            type="button"
                            onClick={addChannel}
                            disabled={creating}
                            className="mt-1 flex items-center justify-center gap-1.5 rounded-xl glass border border-dashed border-white/10 py-2 text-xs text-fg-tertiary transition-all duration-200 [transition-timing-function:var(--spring-standard)] hover:border-primary/40 hover:text-primary active:scale-[0.97] disabled:opacity-50"
                        >
                            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                            </svg>
                            Agregar canal
                        </button>
                    )}
                </div>

                {/* Error */}
                {error && <p className="text-xs text-danger">{error}</p>}

                {/* Submit */}
                <Button
                    type="submit"
                    loading={creating}
                    disabled={!name.trim()}
                    className="w-full"
                >
                    Crear servidor
                </Button>
            </form>
        </Modal>
    );
}
