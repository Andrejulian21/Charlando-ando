// /dms/{dm} — single DM thread view. Reuses the DmList and DmChat
// components so the layout is consistent with the DM index page.

import { Head } from '@inertiajs/react';
import ServerSidebar from '../../components/Chat/ServerSidebar';
import DmList from '../../components/Dm/DmList';
import UserFloatingBar from '../../components/Layout/UserFloatingBar';
import ChatLayout from '../../components/Layout/ChatLayout';
import DmChat from '../../components/Dm/DmChat';

export default function DmsShow({
    dm,
    otherUser = null,
    messages = [],
    nextCursor = null,
    currentUserId,
    threads = [],
    servers = [],
    auth = {},
}) {
    return (
        <>
            <Head title="Mensaje directo" />

            <ChatLayout
                sidebar={<ServerSidebar servers={servers} />}
                channelList={
                    <DmList threads={threads} currentUserId={currentUserId} activeDmId={dm?.id} />
                }
            >
                <DmChat
                    dm={dm}
                    otherUser={otherUser}
                    messages={messages}
                    nextCursor={nextCursor}
                    currentUserId={currentUserId}
                />
            </ChatLayout>
            <UserFloatingBar />
        </>
    );
}
