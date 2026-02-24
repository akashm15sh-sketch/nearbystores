'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { Store } from '@/types';
import { getImageUrl } from '@/lib/imageUrl';
import Link from 'next/link';
import LocationPermissionModal from '@/components/LocationPermissionModal';
import SearchBar from '@/components/SearchBar';

// Cart Button Component
function CartButton() {
    const router = useRouter();
    const { getItemCount } = useCartStore();
    const itemCount = getItemCount();

    return (
        <button
            onClick={() => router.push('/cart')}
            className="relative p-2 hover:bg-orange-50 rounded-lg transition-colors"
        >
            <span className="text-2xl">🛒</span>
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                </span>
            )}
        </button>
    );
}

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const savedLocation = localStorage.getItem('nearbyStores_userLocation');
        const locationGranted = localStorage.getItem('nearbyStores_locationGranted');

        if (savedLocation) {
            try {
                const location = JSON.parse(savedLocation);
                setUserLocation(location);
            } catch (e) {
                console.error('Failed to parse saved location');
            }
        }

        if (locationGranted !== 'true' && !locationPermissionAsked && !savedLocation) {
            setShowLocationModal(true);
            setLocationPermissionAsked(true);
        }
    }, [isAuthenticated, router, locationPermissionAsked]);

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    localStorage.setItem('nearbyStores_userLocation', JSON.stringify(location));
                    localStorage.setItem('nearbyStores_locationGranted', 'true');
                    setUserLocation(location);
                    setShowLocationModal(false);
                },
                () => {
                    setShowLocationModal(false);
                }
            );
        }
    };

    const handleLocationAllow = () => requestLocation();
    const handleLocationDeny = () => setShowLocationModal(false);

    useEffect(() => {
        fetchStores();
    }, [userLocation]);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (userLocation) {
                params.latitude = userLocation.lat;
                params.longitude = userLocation.lng;
                params.maxDistance = 10000;

                await api.post('/stores/location', {
                    latitude: userLocation.lat,
                    longitude: userLocation.lng
                });
            }

            const { data } = await api.get('/stores', { params });
            setStores(data.stores);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Location Permission Modal */}
            <LocationPermissionModal
                isOpen={showLocationModal}
                onAllow={handleLocationAllow}
                onDeny={handleLocationDeny}
            />

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Hello, {user?.username || 'there'} 👋
                            </h1>
                            <p className="text-sm text-gray-500">Find stores near you</p>
                        </div>
                        <CartButton />
                    </div>
                    <SearchBar userLocation={userLocation || undefined} />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-5">
                {/* Quick Actions */}
                <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
                    <Link href="/map" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all whitespace-nowrap shadow-sm">
                        🗺️ Map View
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all whitespace-nowrap shadow-sm">
                        📦 My Orders
                    </Link>
                    <Link href="/cart" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all whitespace-nowrap shadow-sm">
                        🛒 Cart
                    </Link>
                </div>

                {/* Stores Section */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Nearby Stores</h2>
                    <span className="text-sm text-gray-400">{stores.length} found</span>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
                        <p className="mt-3 text-sm text-gray-500">Loading stores...</p>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="text-5xl mb-3">🏪</div>
                        <p className="text-lg font-medium text-gray-700">No stores found nearby</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different location or check back later</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stores.map((store, index) => (
                            <Link
                                key={store._id}
                                href={`/store/${store._id}`}
                                className="flex bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                {/* Store Image */}
                                <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-orange-100 to-orange-50">
                                    {store.images && store.images[0] ? (
                                        <img
                                            src={getImageUrl(store.images[0])}
                                            alt={store.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
                                    )}
                                </div>

                                {/* Store Info */}
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-gray-800 text-base truncate">{store.name}</h3>
                                            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${store.currentStatus === 'open' ? 'bg-green-100 text-green-700' :
                                                store.currentStatus === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {store.currentStatus === 'open' ? 'Open' :
                                                    store.currentStatus === 'busy' ? 'Busy' : 'Closed'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {store.description || 'No description'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                                            {store.category}
                                        </span>
                                        {store.distance && (
                                            <span className="text-xs text-gray-400">
                                                📍 {store.distance < 1000
                                                    ? `${store.distance}m`
                                                    : `${(store.distance / 1000).toFixed(1)}km`}
                                            </span>
                                        )}
                                        {store.rating > 0 && (
                                            <span className="text-xs text-gray-500">
                                                ⭐ {store.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>


            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around py-3">
                        <Link href="/home" className="flex flex-col items-center gap-0.5">
                            <span className="text-xl">🏪</span>
                            <span className="text-xs font-semibold text-orange-600">Home</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-0.5">
                            <span className="text-xl">📦</span>
                            <span className="text-xs font-medium text-gray-500">Orders</span>
                        </Link>
                        <Link href="/map" className="flex flex-col items-center gap-0.5">
                            <span className="text-xl">🗺️</span>
                            <span className="text-xs font-medium text-gray-500">Map</span>
                        </Link>
                        <Link href="/profile" className="flex flex-col items-center gap-0.5">
                            <span className="text-xl">👤</span>
                            <span className="text-xs font-medium text-gray-500">Profile</span>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}
