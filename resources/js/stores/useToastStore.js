import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
    toasts: [],
    add: (toast) => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
        setTimeout(() => get().dismiss(id), toast.duration ?? 4000);
    },
    dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    clearAll: () => set({ toasts: [] }),
}));

export const toast = {
    success: (message, opts) => useToastStore.getState().add({ type: 'success', message, ...opts }),
    error: (message, opts) => useToastStore.getState().add({ type: 'error', message, ...opts }),
    info: (message, opts) => useToastStore.getState().add({ type: 'info', message, ...opts }),
};
