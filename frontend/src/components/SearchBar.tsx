'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface SearchResult {
    stores: Array<{
        id: string;
        name: string;
        category: string;
        distance?: number;
    }>;
    products: Array<{
        productId: string;
        productName: string;
        price: number;
        inStock: boolean;
        store: {
            id: string;
            name: string;
            category: string;
        };
    }>;
}

interface SearchBarProps {
    userLocation?: { lat: number; lng: number };
}

const categories = [
    { id: 'all', name: 'All Stores', icon: '🏪' },
    { id: 'food', name: 'Food', icon: '🍔' },
    { id: 'general', name: 'General', icon: '🛒' },
    { id: 'hardware', name: 'Hardware', icon: '🔧' },
    { id: 'other', name: 'Other', icon: '📦' },
];

export default function SearchBar({ userLocation }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults(null);
            setShowResults(false);
            return;
        }

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const params = new URLSearchParams({ q: query });
                if (userLocation) {
                    params.append('lat', userLocation.lat.toString());
                    params.append('lng', userLocation.lng.toString());
                }
                if (selectedCategory && selectedCategory !== 'all') {
                    params.append('category', selectedCategory);
                }

                const response = await api.get(`/search/global?${params}`);
                setResults(response.data.results);
                setShowResults(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query, userLocation, selectedCategory]);

    const handleStoreClick = (storeId: string) => {
        router.push(`/store/${storeId}`);
        setShowResults(false);
        setQuery('');
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search stores and products..."
                    className="w-full px-4 py-3 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                </div>
                {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Search Results Dropdown */}
            {showResults && results && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {/* Stores */}
                    {results.stores.length > 0 && (
                        <div className="p-3 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-2 px-2">STORES</h3>
                            {results.stores.map((store) => (
                                <button
                                    key={store.id}
                                    onClick={() => handleStoreClick(store.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                    <div className="font-medium text-gray-800">{store.name}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <span>{store.category}</span>
                                        {store.distance && (
                                            <>
                                                <span>•</span>
                                                <span>{store.distance.toFixed(1)} km away</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Products */}
                    {results.products.length > 0 && (
                        <div className="p-3">
                            <h3 className="text-sm font-bold text-gray-500 mb-2 px-2">PRODUCTS</h3>
                            {results.products.map((product, index) => (
                                <button
                                    key={`${product.store.id}-${product.productId}-${index}`}
                                    onClick={() => handleStoreClick(product.store.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-800">{product.productName}</div>
                                            <div className="text-sm text-gray-500">{product.store.name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-orange-600">₹{product.price}</div>
                                            {!product.inStock && (
                                                <div className="text-xs text-red-500">Out of stock</div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {results.stores.length === 0 && results.products.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <div className="text-4xl mb-2">🔍</div>
                            <div>No results found for "{query}"</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
