'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Store } from '@/types';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LocationPermissionModal from '@/components/LocationPermissionModal';
// Import leaflet only on client side to avoid SSR 'window is not defined' error
const L = typeof window !== 'undefined' ? require('leaflet') : null;

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

export default function MapPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [stores, setStores] = useState<Store[]>([]);
    // Initialize with null, will be set from localStorage or default
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [actualUserLocation, setActualUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
    const [mapKey, setMapKey] = useState(0); // For forcing map re-render

    // Create custom icon for user location
    const userLocationIcon = typeof window !== 'undefined' ? L.divIcon({
        html: `<div style="position: relative; width: 40px; height: 40px;">
                <img src="/pin-icon.svg" style="width: 40px; height: 40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />
               </div>`,
        className: 'custom-user-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }) : undefined;

    // Create custom icon for stores
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

    // Get default icon based on category
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

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check for saved location in localStorage
        const savedLocation = localStorage.getItem('nearbyStores_userLocation');
        const locationGranted = localStorage.getItem('nearbyStores_locationGranted');

        if (savedLocation) {
            try {
                const location = JSON.parse(savedLocation);
                setUserLocation(location);
                setActualUserLocation(location);
                fetchStores(location);
            } catch (e) {
                console.error('Failed to parse saved location');
                // Use default location only if no saved location
                const defaultLocation = { lat: 28.6139, lng: 77.2090 };
                setUserLocation(defaultLocation);
                fetchStores(defaultLocation);
            }
        } else {
            // Use default location only on first visit
            const defaultLocation = { lat: 28.6139, lng: 77.2090 };
            setUserLocation(defaultLocation);
            fetchStores(defaultLocation);
        }

        // Only show modal if permission not granted before
        if (locationGranted !== 'true' && !locationPermissionAsked) {
            setShowLocationModal(true);
            setLocationPermissionAsked(true);
        }
    }, [isAuthenticated, router]);

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    // Save to localStorage
                    localStorage.setItem('nearbyStores_userLocation', JSON.stringify(location));
                    localStorage.setItem('nearbyStores_locationGranted', 'true');

                    setActualUserLocation(location);
                    setUserLocation(location);
                    setShowLocationModal(false);
                    setMapKey(prev => prev + 1); // Force map re-render to recenter
                    // Refresh stores with actual location
                    fetchStores(location);
                },
                (error) => {
                    // User denied or error occurred - this is expected, not an error
                    setShowLocationModal(false);
                    // Keep default location, map still works
                }
            );
        } else {
            setShowLocationModal(false);
        }
    };

    const handleFindMe = () => {
        if (actualUserLocation) {
            setUserLocation(actualUserLocation);
            setMapKey(prev => prev + 1); // Force map re-render to recenter
        } else {
            // Request location if not granted yet
            requestLocation();
        }
    };

    const handleLocationAllow = () => {
        requestLocation();
    };

    const handleLocationDeny = () => {
        setShowLocationModal(false);
        // Keep using default location - map still works
        console.log('User denied location - using default location');
    };

    const fetchStores = async (location: { lat: number; lng: number }) => {
        try {
            const { data } = await api.get('/stores', {
                params: {
                    latitude: location.lat,
                    longitude: location.lng,
                    maxDistance: 10000
                }
            });
            setStores(data.stores);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Location Permission Modal */}
            <LocationPermissionModal
                isOpen={showLocationModal}
                onAllow={handleLocationAllow}
                onDeny={handleLocationDeny}
            />

            {/* Header */}
            <header className="gradient-white border-b border-orange-100 z-[1000]">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-gradient">Store Map</h1>
                </div>
            </header>

            {/* Map */}
            <div className="flex-1 relative">
                {/* Find Me Button - Floating */}
                <button
                    onClick={handleFindMe}
                    className="absolute bottom-24 right-4 z-[999] bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
                    title="Find my location"
                >
                    <img src="/pin-icon.svg" alt="Pin" className="w-6 h-6" />
                </button>

                {!userLocation ? (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600">Loading map...</p>
                        </div>
                    </div>
                ) : (
                    <MapContainer
                        key={mapKey}
                        center={[userLocation.lat, userLocation.lng]}
                        zoom={13}
                        className="h-full w-full"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* User Location Marker - Only show if user granted permission */}
                        {actualUserLocation && userLocationIcon && (
                            <Marker
                                position={[actualUserLocation.lat, actualUserLocation.lng]}
                                icon={userLocationIcon}
                            >
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
                                <Marker
                                    key={store._id}
                                    position={[store.location.coordinates[1], store.location.coordinates[0]]}
                                    icon={storeIcon}
                                >
                                    <Popup>
                                        <div className="min-w-[200px]">
                                            <h3 className="font-bold text-lg mb-1">{store.name}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{store.category}</p>
                                            <p className="text-xs text-gray-500 mb-2">{store.location.address}</p>
                                            <Link
                                                href={`/store/${store._id}`}
                                                className="text-orange-600 hover:underline text-sm font-medium"
                                            >
                                                View Details →
                                            </Link>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="gradient-white border-t border-orange-100 glass-effect z-[1000]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around py-3">
                        <Link href="/home" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">🏪</span>
                            <span className="text-xs font-medium text-gray-600">Home</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">📦</span>
                            <span className="text-xs font-medium text-gray-600">Orders</span>
                        </Link>
                        <Link href="/map" className="flex flex-col items-center gap-1 transition-all">
                            <span className="text-2xl">🗺️</span>
                            <span className="text-xs font-semibold text-orange-600">Map</span>
                        </Link>
                        <Link href="/profile" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">👤</span>
                            <span className="text-xs font-medium text-gray-600">Profile</span>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}
