'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        // Only run checks after hydration is complete
        if (!_hasHydrated) return;

        // Simple client-side protection
        if (!isAuthenticated) {
            router.push('/admin/login');
        } else if (user && user.role !== 'admin') {
            // Non-admin users: redirect to admin login, NOT customer home
            router.push('/admin/login');
        }
    }, [isAuthenticated, user, router, _hasHydrated]);

    // Show nothing while hydration is in progress or if auth checks fail
    if (!_hasHydrated) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (!isAuthenticated || (user && user.role !== 'admin')) {
        return null;
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Revenue', href: '/admin/revenue', icon: '💰' },
        { name: 'Stores', href: '/admin/stores', icon: '🏪' },
        { name: 'Users', href: '/admin/users', icon: '👥' },
        { name: 'Customer Care', href: '/admin/customer-care', icon: '💬' },
        { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className={`bg-slate-800 text-white w-64 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64'} fixed h-full z-20`}>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Admin Portal
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                        ✕
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                <span className="mr-3 text-xl">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-700 bg-slate-850">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.username}</p>
                            <p className="text-xs text-gray-400">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            router.push('/admin/login');
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                {/* Header for Mobile */}
                {!isSidebarOpen && (
                    <header className="bg-white shadow-sm p-4 flex items-center lg:hidden">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                            ☰ Menu
                        </button>
                        <span className="ml-4 font-bold text-slate-800">Admin Portal</span>
                    </header>
                )}

                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
