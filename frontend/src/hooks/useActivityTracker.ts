'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

let sessionId: string | null = null;

function getSessionId() {
    if (!sessionId) {
        sessionId = localStorage.getItem('activitySessionId');
        if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem('activitySessionId', sessionId);
        }
    }
    return sessionId;
}

// Get user's current location
function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000, maximumAge: 60000 }
        );
    });
}

export function useActivityTracker() {
    const pathname = usePathname();
    const lastTrackedPage = useRef('');

    const trackAction = useCallback(async (
        action: string,
        details?: Record<string, any>
    ) => {
        const token = localStorage.getItem('token');
        if (!token) return; // Only track authenticated users

        try {
            const location = await getCurrentLocation();
            await api.post('/analytics/track', {
                action,
                details: { page: pathname, ...details },
                location,
                sessionId: getSessionId()
            });
        } catch {
            // Silently fail — tracking should never break the app
        }
    }, [pathname]);

    // Auto-track page views
    useEffect(() => {
        if (pathname && pathname !== lastTrackedPage.current) {
            lastTrackedPage.current = pathname;
            trackAction('page_view', { page: pathname });
        }
    }, [pathname, trackAction]);

    return { trackAction };
}

// Track button clicks
export function trackClick(element: string, metadata?: Record<string, any>) {
    const token = localStorage.getItem('token');
    if (!token) return;

    getCurrentLocation().then(location => {
        api.post('/analytics/track', {
            action: 'button_click',
            details: { element, ...metadata },
            location,
            sessionId: getSessionId()
        }).catch(() => { /* silent */ });
    });
}
