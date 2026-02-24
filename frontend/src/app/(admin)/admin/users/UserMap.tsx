'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface ActiveUser {
    userId: string;
    username: string;
    email: string;
    role: string;
    location: { coordinates: number[] };
    lastAction: string;
    lastPage: string;
    activityCount: number;
    lastSeen: string;
}

interface MapUser {
    userId: string;
    username: string;
    role: string;
    location: { coordinates: number[] };
}

interface Props {
    activeUsers: ActiveUser[];
    allUsers: MapUser[];
}

export default function UserMap({ activeUsers, allUsers }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Default center: India
        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    // Update markers when data changes
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Clear existing markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });

        const bounds: L.LatLng[] = [];

        // Add all users as gray dots
        allUsers.forEach(user => {
            const coords = user.location?.coordinates;
            if (!coords || (coords[0] === 0 && coords[1] === 0)) return;
            const lat = coords[1];
            const lng = coords[0];
            const color = user.role === 'customer' ? '#94a3b8' : '#fdba74';

            L.circleMarker([lat, lng], {
                radius: 4,
                fillColor: color,
                color: color,
                fillOpacity: 0.4,
                weight: 1
            }).bindPopup(`
                <strong>${user.username}</strong><br/>
                <span style="font-size:11px;color:#999">${user.role}</span>
            `).addTo(map);
            bounds.push(L.latLng(lat, lng));
        });

        // Add active users as larger, pulsing markers
        activeUsers.forEach(user => {
            const coords = user.location?.coordinates;
            if (!coords || (coords[0] === 0 && coords[1] === 0)) return;
            const lat = coords[1];
            const lng = coords[0];
            const color = user.role === 'customer' ? '#3b82f6' : '#f97316';

            // Outer pulse ring
            L.circleMarker([lat, lng], {
                radius: 12,
                fillColor: color,
                color: color,
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.4
            }).addTo(map);

            // Inner dot
            L.circleMarker([lat, lng], {
                radius: 6,
                fillColor: color,
                color: '#fff',
                fillOpacity: 1,
                weight: 2
            }).bindPopup(`
                <div style="min-width:150px">
                    <strong style="font-size:14px">${user.username}</strong><br/>
                    <span style="font-size:11px;${user.role === 'customer' ? 'color:#3b82f6' : 'color:#f97316'}">${user.role}</span><br/>
                    <span style="font-size:11px;color:#999">Last: ${user.lastAction.replace('_', ' ')}</span><br/>
                    <span style="font-size:11px;color:#999">Page: ${user.lastPage || '?'}</span><br/>
                    <span style="font-size:11px;color:#999">${user.activityCount} actions</span>
                </div>
            `).addTo(map);
            bounds.push(L.latLng(lat, lng));
        });

        // Fit bounds if we have any points
        if (bounds.length > 0) {
            map.fitBounds(L.latLngBounds(bounds).pad(0.1));
        }
    }, [activeUsers, allUsers]);

    return (
        <div>
            <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Active customer</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Active partner</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span> Registered user</span>
            </div>
        </div>
    );
}
