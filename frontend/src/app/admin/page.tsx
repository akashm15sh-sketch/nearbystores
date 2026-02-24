'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();

    useEffect(() => {
        if (!_hasHydrated) return;

        if (isAuthenticated && user?.role === 'admin') {
            router.replace('/admin/dashboard');
        } else {
            router.replace('/admin/login');
        }
    }, [isAuthenticated, user, router, _hasHydrated]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
    );
}
