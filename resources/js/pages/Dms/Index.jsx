// /dms — landing page for the direct-message surface. The conversation
// list is on the left and a friendly empty state is shown on the right
// until the user picks a thread. The list itself comes from the
// PageController's dmsIndex action.

import { Head } from '@inertiajs/react';
import DmList from '../../components/Dm/DmList';

export default function DmsIndex({ threads = [], currentUserId }) {
    return (
        <>
            <Head title="Mensajes directos" />

            <div className="flex h-screen w-screen overflow-hidden bg-deep-space-900 text-fg">
                <DmList threads={threads} currentUserId={currentUserId} activeDmId={null} />

                <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <div className="max-w-md space-y-3">
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
                            Mensajes directos
                        </h1>
                        <p className="text-sm leading-relaxed text-fg-muted">
                            Elige una conversación de la izquierda o abre un perfil para iniciar una nueva.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}
