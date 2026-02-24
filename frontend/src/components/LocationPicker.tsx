'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';

// Dynamically import Leaflet components
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
// We don't need Marker anymore for the center pin approach, but might need it for initial or other display
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);

// Component to handle map center updates
const MapController = dynamic(
    () => import('react-leaflet').then((mod) => {
        const Controller = ({ onMove, center }: { onMove: (lat: number, lng: number) => void, center?: { lat: number, lng: number } }) => {
            const map = mod.useMap();

            // Notify parent when map moves
            mod.useMapEvents({
                moveend() {
                    const c = map.getCenter();
                    onMove(c.lat, c.lng);
                },
            });

            // Update map view if center prop changes (external control)
            useEffect(() => {
                if (center) {
                    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
                }
            }, [center, map]);

            return null;
        };
        return Controller;
    }),
    { ssr: false }
);

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (!initialLat && !initialLng) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setPosition(newPos);
                        onLocationSelect(newPos.lat, newPos.lng);
                    },
                    () => {
                        setPosition({ lat: 28.6139, lng: 77.2090 });
                        onLocationSelect(28.6139, 77.2090);
                    }
                );
            } else {
                setPosition({ lat: 28.6139, lng: 77.2090 });
                onLocationSelect(28.6139, 77.2090);
            }
        }
    }, []);

    const handleMapMove = (lat: number, lng: number) => {
        // Debounce or direct update? Direct is fine for moveend
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
    };

    if (!isClient) {
        return <div className="h-[300px] w-full bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;
    }

    return (
        <div className="h-[300px] w-full rounded-lg overflow-hidden border border-slate-300 relative z-0 group">
            <MapContainer
                center={position || { lat: 28.6139, lng: 77.2090 }}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapController onMove={handleMapMove} />
            </MapContainer>

            {/* Fixed Center Pin Overlay */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[100%] z-[400] pointer-events-none transition-transform duration-200 ease-out group-active:-translate-y-[120%]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
                    <path d="M12 0C7.58 0 4 3.58 4 8C4 13.54 12 24 12 24C12 24 20 13.54 20 8C20 3.58 16.42 0 12 0ZM12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11Z" fill="#EA580C" />
                </svg>
            </div>

            {/* Hint Text */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium z-[400] pointer-events-none text-gray-700 whitespace-nowrap">
                {position ? `Move map to adjust: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Loading location...'}
            </div>
        </div>
    );
}
