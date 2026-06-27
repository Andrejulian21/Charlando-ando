import { useEffect, useCallback } from 'react';
import { useUiStore } from '../../stores/useUiStore';

const BREAKPOINTS = { desktop: 1024, tablet: 768 };

export default function ChatLayout({ sidebar, channelList, memberList, children }) {
    const { memberListOpen, sidebarOpen, channelListOpen, setBreakpoint } = useUiStore();

    const handleResize = useCallback(() => {
        const w = window.innerWidth;
        if (w >= BREAKPOINTS.desktop) setBreakpoint('desktop');
        else if (w >= BREAKPOINTS.tablet) setBreakpoint('tablet');
        else setBreakpoint('mobile');
    }, [setBreakpoint]);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-surface-base text-fg-primary">
            {sidebar && (
                <div className={`flex h-full shrink-0 flex-col overflow-hidden transition-all duration-300 [transition-timing-function:var(--spring-gentle)] ${sidebarOpen ? 'w-[72px] opacity-100 visible pointer-events-auto' : 'w-0 opacity-0 invisible pointer-events-none'}`}>
                    {sidebar}
                </div>
            )}
            {channelList && (
                <div className={`hidden h-full shrink-0 overflow-hidden transition-all duration-300 [transition-timing-function:var(--spring-gentle)] md:block lg:block ${channelListOpen ? 'w-60 opacity-100 visible pointer-events-auto' : 'w-0 opacity-0 invisible pointer-events-none'}`}>
                    {channelList}
                </div>
            )}
            <main className="flex min-w-0 flex-1 flex-col">
                {children}
            </main>
            {memberList && (
                <div className={`hidden h-full shrink-0 overflow-hidden transition-all duration-300 [transition-timing-function:var(--spring-gentle)] lg:block ${memberListOpen ? 'w-60 opacity-100 visible pointer-events-auto' : 'w-0 opacity-0 invisible pointer-events-none'}`}>
                    {memberList}
                </div>
            )}
        </div>
    );
}
