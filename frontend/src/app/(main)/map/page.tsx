'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Store } from '@/types';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LocationPermissionModal from '@/components/LocationPermissionModal';
const L = typeof window !== 'undefined' ? require('leaflet') : null;

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });

const RADIUS_STEPS = [
    { value: 200, label: '200m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 25000, label: '25km' },
    { value: 50000, label: '50km' },
    { value: 100000, label: '100km' },
    { value: 200000, label: '200km' },
    { value: 400000, label: '400km' },
];

function getRadiusLabel(meters: number): string {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)}km`;
}

export default function MapPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [stores, setStores] = useState<Store[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [actualUserLocation, setActualUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [showRadiusPanel, setShowRadiusPanel] = useState(false);
    const [radiusIndex, setRadiusIndex] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nearbyStores_searchRadius');
            if (saved) {
                const idx = RADIUS_STEPS.findIndex(s => s.value === parseInt(saved));
                return idx >= 0 ? idx : 5;
            }
        }
        return 5;
    });

    const currentRadius = RADIUS_STEPS[radiusIndex];

    const userLocationIcon = typeof window !== 'undefined' ? L.divIcon({
        html: `<div style="position: relative; width: 40px; height: 40px;">
                <img src="/pin-icon.svg" style="width: 40px; height: 40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />
               </div>`,
        className: 'custom-user-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }) : undefined;

    const createStoreIcon = (store: Store) => {
        if (typeof window === 'undefined') return undefined;
        const iconUrl = store.icon || getCategoryIcon(store.category);
        return L.divIcon({
            html: `<div style="position: relative; width: 36px; height: 36px;">
                    <img src="${iconUrl}" style="width: 36px; height: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); border-radius: 50%; background: white; padding: 4px;" />
                   </div>`,
            className: 'custom-store-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });
    };

    const getCategoryIcon = (category: string) => {
        const iconMap: Record<string, string> = {
            'food': 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
            'grocery': 'https://cdn-icons-png.flaticon.com/512/3514/3514227.png',
            'bakery': 'https://cdn-icons-png.flaticon.com/512/3081/3081967.png',
            'restaurant': 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png',
            'pharmacy': 'https://cdn-icons-png.flaticon.com/512/2913/2913461.png',
            'electronics': 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png',
            'clothing': 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
            'beauty': 'https://cdn-icons-png.flaticon.com/512/1940/1940922.png',
            'sports': 'https://cdn-icons-png.flaticon.com/512/857/857455.png',
            'books': 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png',
            'pets': 'https://cdn-icons-png.flaticon.com/512/3460/3460335.png',
            'hardware': 'https://cdn-icons-png.flaticon.com/512/2910/2910768.png',
            'home_decor': 'https://cdn-icons-png.flaticon.com/512/2400/2400589.png',
            'general': 'https://cdn-icons-png.flaticon.com/512/2331/2331966.png',
            'other': 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png'
        };
        return iconMap[category] || iconMap['other'];
    };

    const fetchStores = useCallback(async (location: { lat: number; lng: number }, radius: number) => {
        try {
            const { data } = await api.get('/stores', {
                params: { latitude: location.lat, longitude: location.lng, maxDistance: radius }
            });
            setStores(data.stores);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        const savedLocation = localStorage.getItem('nearbyStores_userLocation');
        const locationGranted = localStorage.getItem('nearbyStores_locationGranted');
        if (savedLocation) {
            try {
                const location = JSON.parse(savedLocation);
                setUserLocation(location);
                setActualUserLocation(location);
                fetchStores(location, currentRadius.value);
            } catch {
                const def = { lat: 28.6139, lng: 77.2090 };
                setUserLocation(def);
                fetchStores(def, currentRadius.value);
            }
        } else {
            const def = { lat: 28.6139, lng: 77.2090 };
            setUserLocation(def);
            fetchStores(def, currentRadius.value);
        }
        if (locationGranted !== 'true' && !locationPermissionAsked) {
            setShowLocationModal(true);
            setLocationPermissionAsked(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, router]);

    // Refetch when radius changes
    useEffect(() => {
        if (userLocation) {
            fetchStores(userLocation, currentRadius.value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radiusIndex]);

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = { lat: position.coords.latitude, lng: position.coords.longitude };
                    localStorage.setItem('nearbyStores_userLocation', JSON.stringify(location));
                    localStorage.setItem('nearbyStores_locationGranted', 'true');
                    setActualUserLocation(location);
                    setUserLocation(location);
                    setShowLocationModal(false);
                    setMapKey(prev => prev + 1);
                    fetchStores(location, currentRadius.value);
                },
                () => setShowLocationModal(false)
            );
        } else { setShowLocationModal(false); }
    };

    const handleFindMe = () => {
        if (actualUserLocation) { setUserLocation(actualUserLocation); setMapKey(prev => prev + 1); }
        else requestLocation();
    };

    const handleRadiusChange = (idx: number) => {
        setRadiusIndex(idx);
        localStorage.setItem('nearbyStores_searchRadius', RADIUS_STEPS[idx].value.toString());
    };

    return (
        <div className="h-screen flex flex-col">
            <LocationPermissionModal isOpen={showLocationModal} onAllow={requestLocation} onDeny={() => setShowLocationModal(false)} />

            {/* Premium Header */}
            <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 z-[1000] shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">🗺️ Store Map</h1>
                    <button onClick={() => setShowRadiusPanel(!showRadiusPanel)}
                        className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/30 transition-all border border-white/30">
                        📍 {getRadiusLabel(currentRadius.value)}
                    </button>
                </div>

                {/* Radius Panel */}
                {showRadiusPanel && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
                            <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                                <span>200m</span>
                                <span className="text-orange-600 font-bold">{currentRadius.label}</span>
                                <span>400km</span>
                            </div>
                            <input type="range" min={0} max={RADIUS_STEPS.length - 1} value={radiusIndex}
                                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {RADIUS_STEPS.map((step, i) => (
                                    <button key={step.value} onClick={() => handleRadiusChange(i)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${i === radiusIndex
                                            ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-500 hover:bg-orange-100'}`}>
                                        {step.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Map */}
            <div className="flex-1 relative">
                <button onClick={handleFindMe}
                    className="absolute bottom-24 right-4 z-[999] bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
                    title="Find my location">
                    <img src="/pin-icon.svg" alt="Pin" className="w-6 h-6" />
                </button>

                {/* Store Count Badge */}
                <div className="absolute top-4 left-4 z-[999] bg-white/90 backdrop-blur-lg px-4 py-2 rounded-2xl shadow-lg border border-white/60">
                    <span className="text-sm font-bold text-gray-700">{stores.length} stores</span>
                    <span className="text-xs text-gray-400 ml-1">within {currentRadius.label}</span>
                </div>

                {!userLocation ? (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-500">Loading map...</p>
                        </div>
                    </div>
                ) : (
                    <MapContainer key={mapKey} center={[userLocation.lat, userLocation.lng]} zoom={13} className="h-full w-full">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Radius Circle */}
                        {actualUserLocation && (
                            <Circle
                                center={[actualUserLocation.lat, actualUserLocation.lng]}
                                radius={currentRadius.value}
                                pathOptions={{
                                    color: '#f97316',
                                    fillColor: '#fed7aa',
                                    fillOpacity: 0.15,
                                    weight: 2,
                                    dashArray: '8 4'
                                }}
                            />
                        )}

                        {/* User Location Marker */}
                        {actualUserLocation && userLocationIcon && (
                            <Marker position={[actualUserLocation.lat, actualUserLocation.lng]} icon={userLocationIcon}>
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-bold text-orange-600">📍 You are here</p>
                                        <p className="text-xs text-gray-500 mt-1">Your current location</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Store Markers */}
                        {stores.map((store) => {
                            const storeIcon = createStoreIcon(store);
                            return (
                                <Marker key={store._id} position={[store.location.coordinates[1], store.location.coordinates[0]]} icon={storeIcon}>
                                    <Popup>
                                        <div className="min-w-[220px]">
                                            <h3 className="font-bold text-lg mb-1">{store.name}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{store.category}</span>
                                                {store.rating > 0 && (
                                                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">⭐ {store.rating.toFixed(1)}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">{store.location.address}</p>
                                            {store.distance && (
                                                <p className="text-xs text-gray-400 mb-2">
                                                    📍 {store.distance < 1000 ? `${Math.round(store.distance)}m` : `${(store.distance / 1000).toFixed(1)}km`} away
                                                </p>
                                            )}
                                            <Link href={`/store/${store._id}`}
                                                className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                                                View Store →
                                            </Link>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}
            </div>

            {/* Premium Bottom Nav */}
            <nav className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 z-[1000] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around py-3">
                        <Link href="/home" className="flex flex-col items-center gap-0.5 group">
                            <span className="text-xl">🏪</span>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-orange-600 transition-colors">Home</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-0.5 group">
                            <span className="text-xl">📦</span>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-orange-600 transition-colors">Orders</span>
                        </Link>
                        <Link href="/map" className="flex flex-col items-center gap-0.5">
                            <span className="text-xl">🗺️</span>
                            <span className="text-xs font-bold text-orange-600">Map</span>
                        </Link>
                        <Link href="/profile" className="flex flex-col items-center gap-0.5 group">
                            <span className="text-xl">👤</span>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-orange-600 transition-colors">Profile</span>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}
