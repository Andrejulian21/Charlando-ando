// Persistent layout shell. Wraps every authenticated page with the floating
// user bar at the bottom-left corner, glassmorphism mesh gradient background,
// and global toast notifications.

import { usePage } from '@inertiajs/react';
import UserFloatingBar from './UserFloatingBar';
import MeshGradient from '../ui/MeshGradient';
import ToastContainer from '../ui/Toast';

export default function AppLayout({ children }) {
    return (
        <>
            <MeshGradient />
            <div className="relative z-10">
                {children}
            </div>
            <UserFloatingBar />
            <ToastContainer />
        </>
    );
}
