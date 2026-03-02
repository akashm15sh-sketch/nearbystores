'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { Store, Review } from '@/types';
import { getImageUrl } from '@/lib/imageUrl';
import Link from 'next/link';

export default function StorePage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const { addItem, getItemCount } = useCartStore();
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [distribution, setDistribution] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const [reviewTotal, setReviewTotal] = useState(0);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchStore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
            const { data } = await api.get(`/reviews/store/${params.id}`);
            setReviews(data.reviews);
            setDistribution(data.distribution);
            setReviewTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'reviews' && reviews.length === 0) {
            fetchReviews();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleAddToCart = (product: any) => {
        if (!product.inStock) return;
        addItem(
            { productId: product._id || product.name, productName: product.name, price: product.price, quantity: 1, inStock: product.inStock },
            store!._id, store!.name
        );
        setShowCart(true);
        setTimeout(() => setShowCart(false), 2000);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0) return;
        setSubmittingReview(true);
        try {
            await api.post('/reviews', { storeId: params.id, rating: newRating, comment: newComment });
            setReviewSuccess('Review submitted! ✓');
            setNewRating(0);
            setNewComment('');
            fetchReviews();
            fetchStore(); // refresh store rating
            setTimeout(() => setReviewSuccess(''), 3000);
        } catch (err: any) {
            setReviewSuccess(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const filteredProducts = store?.products?.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20">
                <div className="text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-xl font-medium text-gray-600">Store not found</p>
                    <Link href="/home" className="mt-4 inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:-translate-y-0.5 transition-all">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const currentDay = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const cartItemCount = getItemCount();

    const StarSelector = ({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => onSelect(star)}
                    className={`text-3xl transition-all hover:scale-125 ${star <= rating ? 'text-yellow-400 drop-shadow-md' : 'text-gray-300'}`}>
                    ★
                </button>
            ))}
        </div>
    );

    const renderStars = (rating: number) => {
        return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20 pb-20">
            {/* Premium Header */}
            <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 sticky top-0 z-10 shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.back()} className="text-white text-xl bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-sm">
                                ←
                            </button>
                            <h1 className="text-lg font-bold text-white truncate max-w-[200px]">{store.name}</h1>
                        </div>
                        {cartItemCount > 0 && (
                            <Link href="/cart" className="relative bg-white/20 backdrop-blur-sm p-2.5 rounded-xl hover:bg-white/30 transition-all">
                                <span className="text-xl">🛒</span>
                                <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                                    {cartItemCount}
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-5">
                {/* Store Image */}
                {store.images && store.images.length > 0 && (
                    <div className="mb-5 rounded-3xl overflow-hidden shadow-xl relative">
                        <img src={getImageUrl(store.images[0])} alt={store.name} className="w-full h-56 object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <div className="flex items-center gap-3">
                                {store.rating > 0 && (
                                    <span className="bg-white/90 backdrop-blur-sm text-orange-600 text-sm font-bold px-3 py-1 rounded-lg shadow-md">
                                        ⭐ {store.rating.toFixed(1)}
                                    </span>
                                )}
                                <span className={`text-sm font-bold px-3 py-1 rounded-lg shadow-md ${store.currentStatus === 'open' ? 'bg-emerald-500 text-white' :
                                        store.currentStatus === 'busy' ? 'bg-amber-500 text-white' :
                                            'bg-red-500 text-white'
                                    }`}>
                                    {store.currentStatus === 'open' ? '🟢 Open' : store.currentStatus === 'busy' ? '🟡 Busy' : '🔴 Closed'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Store Info Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 p-6 mb-5 shadow-xl shadow-gray-200/30">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{store.name}</h2>
                            <span className="inline-block mt-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-xl text-sm font-semibold border border-orange-100">{store.category}</span>
                        </div>
                    </div>
                    {store.description && <p className="text-gray-600 mb-4 leading-relaxed">{store.description}</p>}
                    <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">📍</span> {store.location?.address || 'Address not available'}
                        </p>
                        {store.contact?.phone && (
                            <p className="flex items-center gap-2">
                                <span className="font-semibold">📞</span>
                                <a href={`tel:${store.contact.phone}`} className="text-orange-600 hover:underline font-medium">{store.contact.phone}</a>
                            </p>
                        )}
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-5 bg-white/60 backdrop-blur-lg p-1.5 rounded-2xl border border-white/60 shadow-md">
                    <button onClick={() => setActiveTab('products')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'products'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                        🛍️ Products
                    </button>
                    <button onClick={() => setActiveTab('reviews')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'reviews'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                        ⭐ Reviews {reviewTotal > 0 && `(${reviewTotal})`}
                    </button>
                </div>

                {/* Products Tab */}
                {activeTab === 'products' && (
                    <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 p-6 mb-5 shadow-xl shadow-gray-200/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Products</h3>
                            {store.products && store.products.length > 0 && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{filteredProducts.length}/{store.products.length}</span>
                            )}
                        </div>

                        {!store.products || store.products.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <div className="text-5xl mb-3">📦</div>
                                <p className="font-medium text-gray-500">No products listed yet</p>
                            </div>
                        ) : (
                            <>
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all mb-4"
                                />
                                {filteredProducts.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredProducts.map((product, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800">{product.name}</h4>
                                                    <p className="text-orange-600 font-bold text-xl mt-1">₹{product.price}</p>
                                                    <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${product.inStock ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                </div>
                                                <button onClick={() => handleAddToCart(product)} disabled={!product.inStock}
                                                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${product.inStock
                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                                                    + Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="text-4xl mb-2">🔍</div>
                                        <p>No products matching &quot;{searchQuery}&quot;</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="space-y-5">
                        {/* Rating Overview */}
                        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 p-6 shadow-xl shadow-gray-200/30">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-5xl font-black text-gray-800">{store.rating > 0 ? store.rating.toFixed(1) : '—'}</div>
                                    <div className="text-yellow-400 text-lg mt-1">{renderStars(store.rating)}</div>
                                    <p className="text-xs text-gray-400 mt-1">{reviewTotal} reviews</p>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = distribution[star] || 0;
                                        const pct = reviewTotal > 0 ? (count / reviewTotal) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-2 text-sm">
                                                <span className="w-3 text-gray-500 font-medium">{star}</span>
                                                <span className="text-yellow-400 text-xs">★</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-yellow-400 to-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-6 text-right text-xs text-gray-400">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Write Review */}
                        {isAuthenticated && (
                            <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 p-6 shadow-xl shadow-gray-200/30">
                                <h4 className="font-bold text-gray-800 mb-4">Write a Review</h4>
                                {reviewSuccess && (
                                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl mb-4 text-sm text-emerald-700 font-medium">{reviewSuccess}</div>
                                )}
                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Your Rating</label>
                                        <StarSelector rating={newRating} onSelect={setNewRating} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Your Review (optional)</label>
                                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all resize-none"
                                            rows={3} placeholder="Share your experience..." maxLength={1000} />
                                    </div>
                                    <button type="submit" disabled={newRating === 0 || submittingReview}
                                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Reviews List */}
                        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 p-6 shadow-xl shadow-gray-200/30">
                            <h4 className="font-bold text-gray-800 mb-4">All Reviews</h4>
                            {reviewsLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-orange-500 border-t-transparent mx-auto"></div>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <div className="text-4xl mb-2">💬</div>
                                    <p className="font-medium">No reviews yet</p>
                                    <p className="text-sm mt-1">Be the first to review this store!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {review.customer?.username?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-sm">{review.customer?.username || 'Anonymous'}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-yellow-400 text-sm mb-1">{renderStars(review.rating)}</div>
                                            {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Schedule */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 p-6 mt-5 shadow-xl shadow-gray-200/30">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Opening Hours</h3>
                    {!store.schedule ? (
                        <p className="text-gray-400 text-sm text-center py-4">Opening hours not set yet</p>
                    ) : (
                        <div className="space-y-2">
                            {days.map((day) => {
                                const schedule = store.schedule![day];
                                const isToday = day === currentDay;
                                if (!schedule) return null;
                                return (
                                    <div key={day} className={`flex justify-between items-center p-3 rounded-2xl transition-all ${isToday ? 'bg-orange-50 border border-orange-200 shadow-sm' : 'bg-gray-50/80'}`}>
                                        <span className={`font-medium capitalize text-sm ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
                                            {day} {isToday && '(Today)'}
                                        </span>
                                        <span className={`text-sm font-medium ${isToday ? 'text-orange-700' : 'text-gray-500'}`}>
                                            {schedule.isOpen ? `${schedule.open} – ${schedule.close}` : 'Closed'}
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
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold animate-bounce z-50">
                    ✓ Added to cart!
                </div>
            )}
        </div>
    );
}
