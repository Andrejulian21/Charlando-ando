// /dms/{dm} — single DM thread view. Reuses the DmList and DmChat
// components so the layout is consistent with the DM index page.

import { Head } from '@inertiajs/react';
import DmList from '../../components/Dm/DmList';
import DmChat from '../../components/Dm/DmChat';

export default function DmsShow({ dm, messages = [], nextCursor = null, currentUserId, threads = [] }) {
    return (
        <>
            <Head title="Direct Message" />

            <div className="flex h-screen w-screen overflow-hidden bg-deep-space-900 text-fg">
                <DmList threads={threads} currentUserId={currentUserId} activeDmId={dm?.id} />
                <DmChat dm={dm} messages={messages} nextCursor={nextCursor} currentUserId={currentUserId} />
            </div>
        </>
    );
}
