import { create } from 'zustand';

export const useUiStore = create((set) => ({
    // Panel visibility
    memberListOpen: true,
    channelListOpen: true,
    sidebarOpen: true,

    // Active modal (null | 'serverCreate' | 'userSearch')
    activeModal: null,

    // Breakpoint (desktop | tablet | mobile)
    breakpoint: 'desktop',

    // Navigation state
    navigating: false,

    toggleMemberList: () => set((s) => ({ memberListOpen: !s.memberListOpen })),
    toggleChannelList: () => set((s) => ({ channelListOpen: !s.channelListOpen })),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setActiveModal: (modal) => set({ activeModal: modal }),
    closeModal: () => set({ activeModal: null }),
    setBreakpoint: (bp) => set({ breakpoint: bp }),
    setNavigating: (val) => set({ navigating: val }),
}));
