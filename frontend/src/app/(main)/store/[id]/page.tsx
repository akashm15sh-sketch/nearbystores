'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { Store } from '@/types';
import { getImageUrl } from '@/lib/imageUrl';
import Link from 'next/link';

export default function StorePage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { items, addItem, getItemCount } = useCartStore();
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        fetchStore();
    }, [params.id, isAuthenticated]);

    const fetchStore = async () => {
        try {
            const { data } = await api.get(`/stores/${params.id}`);
            setStore(data.store);
        } catch (error) {
            console.error('Failed to fetch store:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: any) => {
        if (!product.inStock) {
            alert('This product is out of stock');
            return;
        }

        addItem(
            {
                productId: product._id || product.name,
                productName: product.name,
                price: product.price,
                quantity: 1,
                inStock: product.inStock
            },
            store!._id,
            store!.name
        );

        setShowCart(true);
        setTimeout(() => setShowCart(false), 2000);
    };

    // Filter products based on search query
    const filteredProducts = store?.products?.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Store not found</p>
                    <Link href="/home" className="btn-primary mt-4 inline-block">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const cartItemCount = getItemCount();

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="text-2xl">
                                ←
                            </button>
                            <h1 className="text-xl font-bold text-gray-800">{store.name}</h1>
                        </div>
                        {cartItemCount > 0 && (
                            <Link href="/cart" className="relative">
                                <span className="text-2xl">🛒</span>
                                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {cartItemCount}
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Store Images */}
                {store.images && store.images.length > 0 && (
                    <div className="mb-6 rounded-xl overflow-hidden">
                        <img
                            src={getImageUrl(store.images[0])}
                            alt={store.name}
                            className="w-full h-64 object-cover"
                        />
                    </div>
                )}

                {/* Store Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{store.name}</h2>
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                {store.category}
                            </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${store.currentStatus === 'open' ? 'bg-green-100 text-green-700' :
                            store.currentStatus === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {store.currentStatus === 'open' ? '🟢 Open' :
                                store.currentStatus === 'busy' ? '🟡 Busy' : '🔴 Closed'}
                        </span>
                    </div>

                    <p className="text-gray-700 mb-4">{store.description}</p>

                    <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                            <span className="font-semibold">📍 Address:</span>
                            {store.location?.address || 'Address not available'}
                        </p>
                        {store.contact?.phone && (
                            <p className="flex items-center gap-2">
                                <span className="font-semibold">📞 Phone:</span>
                                <a href={`tel:${store.contact.phone}`} className="text-orange-600 hover:underline">
                                    {store.contact.phone}
                                </a>
                            </p>
                        )}
                    </div>
                </div>

                {/* Products */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">🛍️ Products</h3>
                        {store.products && store.products.length > 0 && (
                            <div className="text-sm text-gray-500">
                                {filteredProducts.length} of {store.products.length} items
                            </div>
                        )}
                    </div>

                    {!store.products || store.products.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <div className="text-5xl mb-3">📦</div>
                            <p className="font-medium text-gray-500">No products listed yet</p>
                            <p className="text-sm mt-1">Check back later — the store owner is still setting up.</p>
                        </div>
                    ) : (
                        <>
                            {/* Search Input */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredProducts.map((product, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800">{product.name}</h4>
                                                <p className="text-orange-600 font-bold text-lg mt-1">₹{product.price}</p>
                                                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={!product.inStock}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${product.inStock ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <div>No products found matching "{searchQuery}"</div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Opening Hours</h3>
                    {!store.schedule ? (
                        <p className="text-gray-400 text-sm text-center py-4">Opening hours not set yet</p>
                    ) : (
                        <div className="space-y-2">
                            {days.map((day) => {
                                const schedule = store.schedule![day];
                                const isToday = day === currentDay;
                                if (!schedule) return null;
                                return (
                                    <div
                                        key={day}
                                        className={`flex justify-between items-center p-3 rounded-lg ${isToday ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}
                                    >
                                        <span className={`font-medium capitalize ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
                                            {day} {isToday && '(Today)'}
                                        </span>
                                        <span className="text-gray-600">
                                            {schedule.isOpen ? `${schedule.open} - ${schedule.close}` : 'Closed'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Cart Toast */}
            {showCart && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
                    ✓ Added to cart!
                </div>
            )}
        </div>
    );
}
