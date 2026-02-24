'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import Link from 'next/link';

export default function CartPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { items, storeId, storeName, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'razorpay' | 'qr'>('cash');
    const [loading, setLoading] = useState(false);

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            alert('Your cart is empty');
            return;
        }

        if (orderType === 'delivery' && !deliveryAddress.trim()) {
            alert('Please enter delivery address');
            return;
        }

        setLoading(true);

        try {
            const orderItems = items.map(item => ({
                productId: item.productId,
                productName: item.productName,  // Ensure productName is sent
                quantity: item.quantity,
                price: item.price
            }));

            await api.post('/orders', {
                storeId,
                items: orderItems,
                orderType,  // Add orderType to the request
                deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
                notes,
                paymentMethod
            });

            clearCart();
            alert('Order placed successfully!');
            router.push('/orders');
        } catch (error: any) {
            console.error('Place order error:', error);
            alert(error.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl mb-2">🛒</p>
                    <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
                    <Link href="/home" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 inline-block">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-2xl">
                            ←
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Cart</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Store Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <h2 className="font-bold text-gray-800">{storeName}</h2>
                    <p className="text-sm text-gray-600">{items.length} items</p>
                </div>

                {/* Cart Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <h3 className="font-bold text-gray-800 mb-4">Items</h3>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-800">{item.productName}</h4>
                                    <p className="text-orange-600 font-bold">₹{item.price}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            className="px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200 rounded-l-lg"
                                        >
                                            −
                                        </button>
                                        <span className="px-3 font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            className="px-3 py-1 text-lg font-bold text-gray-700 hover:bg-gray-200 rounded-r-lg"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.productId)}
                                        className="text-red-500 hover:text-red-700 text-xl"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Type */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <h3 className="font-bold text-gray-800 mb-3">Order Type</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`p-4 rounded-lg border-2 transition-all ${orderType === 'pickup'
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                                }`}
                        >
                            <div className="text-2xl mb-1">🏪</div>
                            <div className="font-medium">Pickup</div>
                        </button>
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`p-4 rounded-lg border-2 transition-all ${orderType === 'delivery'
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                                }`}
                        >
                            <div className="text-2xl mb-1">🚚</div>
                            <div className="font-medium">Delivery</div>
                        </button>
                    </div>

                    {orderType === 'delivery' && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Address *
                            </label>
                            <textarea
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows={3}
                                placeholder="Enter your complete delivery address"
                            />
                        </div>
                    )}
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <h3 className="font-bold text-gray-800 mb-3">Payment Method</h3>
                    <div className="space-y-2">
                        {[
                            { value: 'cash', label: '💵 Cash on Delivery', enabled: true },
                            { value: 'razorpay', label: '💳 Online Payment (Razorpay)', enabled: true },
                            { value: 'qr', label: '📱 UPI/QR Payment', enabled: true }
                        ].map((method) => (
                            <label
                                key={method.value}
                                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === method.value
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-orange-300'
                                    } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value={method.value}
                                    checked={paymentMethod === method.value}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    disabled={!method.enabled}
                                    className="mr-3"
                                />
                                <span className="font-medium">{method.label}</span>
                                {!method.enabled && <span className="ml-auto text-xs text-gray-500">(Coming Soon)</span>}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions (Optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={2}
                        placeholder="Any special requests?"
                    />
                </div>

                {/* Total */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total</span>
                        <span className="text-2xl font-bold text-orange-600">₹{getTotal()}</span>
                    </div>
                </div>

                {/* Place Order Button */}
                <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Placing Order...' : 'Place Order'}
                </button>
            </main>
        </div>
    );
}
