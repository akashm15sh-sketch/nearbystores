'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { Store } from '@/types';
import { getImageUrl } from '@/lib/imageUrl';
import Link from 'next/link';
import LocationPermissionModal from '@/components/LocationPermissionModal';
import SearchBar from '@/components/SearchBar';

function CartButton() {
    const router = useRouter();
    const { getItemCount } = useCartStore();
    const itemCount = getItemCount();
    return (
        <button onClick={() => router.push('/cart')}
            className="relative p-2.5 bg-white/80 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <span className="text-xl">🛒</span>
            {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                    {itemCount}
                </span>
            )}
        </button>
    );
}

// Radius slider labels
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

const DEFAULT_RADIUS_INDEX = 5; // 10km

function getRadiusLabel(meters: number): string {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)}km`;
}

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);

    // Hydration-safe radius state: initialize with default, then sync from localStorage
    const [radiusIndex, setRadiusIndex] = useState(DEFAULT_RADIUS_INDEX);
    const [radiusHydrated, setRadiusHydrated] = useState(false);
    const [showRadiusControl, setShowRadiusControl] = useState(false);

    // Category filter
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const currentRadius = RADIUS_STEPS[radiusIndex];

    // Hydrate radius from localStorage (runs only on client, after mount)
    useEffect(() => {
        const saved = localStorage.getItem('nearbyStores_searchRadius');
        if (saved) {
            const idx = RADIUS_STEPS.findIndex(s => s.value === parseInt(saved));
            if (idx >= 0) setRadiusIndex(idx);
        }
        setRadiusHydrated(true);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        const savedLocation = localStorage.getItem('nearbyStores_userLocation');
        const locationGranted = localStorage.getItem('nearbyStores_locationGranted');
        if (savedLocation) {
            try { setUserLocation(JSON.parse(savedLocation)); } catch (e) { /* */ }
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
                    const location = { lat: position.coords.latitude, lng: position.coords.longitude };
                    localStorage.setItem('nearbyStores_userLocation', JSON.stringify(location));
                    localStorage.setItem('nearbyStores_locationGranted', 'true');
                    setUserLocation(location);
                    setShowLocationModal(false);
                },
                () => setShowLocationModal(false)
            );
        }
    };

    const handleLocationAllow = () => requestLocation();
    const handleLocationDeny = () => setShowLocationModal(false);

    const fetchStores = useCallback(async () => {
        if (!radiusHydrated) return;
        setLoading(true);
        try {
            const params: Record<string, unknown> = {};
            if (userLocation) {
                params.latitude = userLocation.lat;
                params.longitude = userLocation.lng;
                params.maxDistance = currentRadius.value;
                await api.post('/stores/location', { latitude: userLocation.lat, longitude: userLocation.lng });
            }
            const { data } = await api.get('/stores', { params });
            setStores(data.stores);

            // Extract unique categories
            const cats = [...new Set(data.stores.map((s: Store) => s.category).filter(Boolean))] as string[];
            setCategories(cats.sort());
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    }, [userLocation, currentRadius.value, radiusHydrated]);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    const handleRadiusChange = (idx: number) => {
        setRadiusIndex(idx);
        localStorage.setItem('nearbyStores_searchRadius', RADIUS_STEPS[idx].value.toString());
    };

    // Filtered stores
    const filteredStores = selectedCategory === 'all'
        ? stores
        : stores.filter(s => s.category === selectedCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 pb-24">
            <LocationPermissionModal isOpen={showLocationModal} onAllow={handleLocationAllow} onDeny={handleLocationDeny} />

            {/* Lighter Premium Header */}
            <header className="bg-gradient-to-r from-orange-400 via-orange-350 to-amber-350 sticky top-0 z-10 shadow-md shadow-orange-100/40">
                <div className="max-w-7xl mx-auto px-4 pt-5 pb-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                Hello, {user?.username || 'there'} 👋
                            </h1>
                            <p className="text-sm text-orange-100/90">Find stores near you</p>
                        </div>
                        <CartButton />
                    </div>
                    <SearchBar userLocation={userLocation || undefined} />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-5">
                {/* Controls Row: Radius + Category */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                    {/* Compact Radius Button */}
                    <div className="relative">
                        <button onClick={() => setShowRadiusControl(!showRadiusControl)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/90 backdrop-blur-lg rounded-xl border border-orange-100 shadow-sm text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:border-orange-200 transition-all">
                            <span>📍</span>
                            <span className="text-orange-600 font-bold">{radiusHydrated ? getRadiusLabel(currentRadius.value) : '...'}</span>
                            <span className={`text-gray-400 text-[10px] transition-transform ${showRadiusControl ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {showRadiusControl && (
                            <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-orange-100 shadow-xl z-20 animate-in slide-in-from-top-2">
                                <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                                    <span>200m</span>
                                    <span>400km</span>
                                </div>
                                <input type="range" min={0} max={RADIUS_STEPS.length - 1} value={radiusIndex}
                                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {RADIUS_STEPS.map((step, i) => (
                                        <button key={step.value} onClick={() => handleRadiusChange(i)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${i === radiusIndex
                                                ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600'}`}>
                                            {step.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Dropdown */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2.5 bg-white/90 backdrop-blur-lg rounded-xl border border-orange-100 shadow-sm text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-200 appearance-none cursor-pointer hover:bg-orange-50 transition-all"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23999' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}
                    >
                        <option value="all">🏷️ All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Stores Section */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Nearby Stores</h2>
                    <span className="text-sm text-gray-400 bg-white/60 px-3 py-1 rounded-full">{filteredStores.length} found</span>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-400 border-t-transparent"></div>
                        <p className="mt-3 text-sm text-gray-500">Loading stores...</p>
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-16 bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-lg">
                        <div className="text-5xl mb-3">🏪</div>
                        <p className="text-lg font-medium text-gray-700">No stores found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {selectedCategory !== 'all' ? 'Try a different category or increase' : 'Try increasing'} your search radius
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredStores.map((store, index) => (
                            <Link key={store._id} href={`/store/${store._id}`}
                                className="flex bg-white/85 backdrop-blur-lg rounded-2xl border border-orange-50 overflow-hidden hover:shadow-xl hover:border-orange-200 hover:-translate-y-0.5 transition-all shadow-md shadow-orange-100/20"
                                style={{ animationDelay: `${index * 40}ms` }}>
                                {/* Store Image */}
                                <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
                                    {store.images && store.images[0] ? (
                                        <img src={getImageUrl(store.images[0])} alt={store.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
                                    )}
                                    {/* Rating badge */}
                                    {store.rating > 0 && (
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                            ⭐ {store.rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>

                                {/* Store Info */}
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-gray-800 text-base truncate">{store.name}</h3>
                                            <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${store.currentStatus === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                store.currentStatus === 'busy' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                    'bg-red-50 text-red-600 border border-red-200'
                                                }`}>
                                                {store.currentStatus}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {store.description || 'No description'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2.5 mt-2">
                                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                            {store.category}
                                        </span>
                                        {store.distance && (
                                            <span className="text-xs text-gray-400 font-medium">
                                                📍 {store.distance < 1000
                                                    ? `${Math.round(store.distance)}m`
                                                    : `${(store.distance / 1000).toFixed(1)}km`}
                                            </span>
                                        )}
                                        {/* Review count */}
                                        {(store.reviewCount ?? 0) > 0 && (
                                            <span className="text-xs text-gray-400 font-medium">
                                                💬 {store.reviewCount}
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
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around py-3">
                        <Link href="/home" className="flex flex-col items-center gap-0.5 group">
                            <span className="text-xl">🏪</span>
                            <span className="text-xs font-bold text-orange-600">Home</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-0.5 group">
                            <span className="text-xl">📦</span>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-orange-600 transition-colors">Orders</span>
                        </Link>
                        <Link href="/map" className="flex flex-col items-center gap-0.5 group">
                            <span className="text-xl">🗺️</span>
                            <span className="text-xs font-medium text-gray-400 group-hover:text-orange-600 transition-colors">Map</span>
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
