import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartStore {
    items: CartItem[];
    storeId: string | null;
    storeName: string | null;
    addItem: (item: CartItem, storeId: string, storeName: string) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            storeId: null,
            storeName: null,

            addItem: (item, storeId, storeName) => {
                const state = get();

                // If cart has items from different store, clear it
                if (state.storeId && state.storeId !== storeId) {
                    if (!confirm(`Your cart has items from ${state.storeName}. Clear cart and add from ${storeName}?`)) {
                        return;
                    }
                    set({ items: [], storeId, storeName });
                }

                const existingItem = state.items.find(i => i.productId === item.productId);

                if (existingItem) {
                    set({
                        items: state.items.map(i =>
                            i.productId === item.productId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )
                    });
                } else {
                    set({
                        items: [...state.items, item],
                        storeId,
                        storeName
                    });
                }
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter(i => i.productId !== productId),
                    ...(state.items.length === 1 ? { storeId: null, storeName: null } : {})
                }));
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                set((state) => ({
                    items: state.items.map(i =>
                        i.productId === productId ? { ...i, quantity } : i
                    )
                }));
            },

            clearCart: () => {
                set({ items: [], storeId: null, storeName: null });
            },

            getTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'cart-storage'
        }
    )
);
