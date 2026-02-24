'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SupportButton from '@/components/SupportButton';
import { useActivityTracker } from '@/hooks/useActivityTracker';

// Pages where we should NOT show the support button
const HIDDEN_PATHS = ['/login', '/register', '/admin/login', '/partner/login', '/partner/register'];

export default function GlobalSupportButton() {
    const pathname = usePathname();
    const [hasToken, setHasToken] = useState(false);

    // Activity tracker — auto-tracks page views for all authenticated users
    useActivityTracker();

    useEffect(() => {
        setHasToken(!!localStorage.getItem('token'));
    }, [pathname]);

    // Don't render on login/register pages or when not authenticated
    if (!hasToken || HIDDEN_PATHS.some(p => pathname === p)) {
        return null;
    }

    return <SupportButton />;
}
