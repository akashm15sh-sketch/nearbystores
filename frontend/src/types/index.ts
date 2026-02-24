export interface User {
    id: string;
    username: string;
    email?: string;
    phone?: string;
    role: 'customer' | 'admin' | 'store_owner';
    preferences: {
        emailNotifications: boolean;
        whatsappNotifications: boolean;
        proximityAlerts: boolean;
    };
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
}

export interface Store {
    _id: string;
    name: string;
    category: 'food' | 'grocery' | 'bakery' | 'restaurant' | 'pharmacy' | 'electronics' | 'clothing' | 'beauty' | 'sports' | 'books' | 'pets' | 'hardware' | 'home_decor' | 'general' | 'other';
    description?: string;
    images: string[];
    icon?: string; // Custom store icon URL
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
        address: string;
    };
    schedule?: {
        [key: string]: {
            open: string;
            close: string;
            isOpen: boolean;
        };
    };
    currentStatus: 'open' | 'closed' | 'busy';
    products: Product[];
    contact: {
        phone?: string;
        email?: string;
        whatsapp?: string;
    };
    rating: number;
    distance?: number; // in meters
    isCurrentlyOpen?: boolean;
    owner?: string; // Owner user ID
    isVerified?: boolean;
}

export interface Product {
    name: string;
    description?: string;
    price: number;
    image?: string;
    inStock: boolean;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export interface ApiError {
    message: string;
    error?: string;
}

export interface Order {
    _id: string;
    orderToken?: string;
    customer: string;
    store: {
        _id: string;
        name: string;
        location: {
            address: string;
        };
        images: string[];
    };
    items: OrderItem[];
    orderType: 'delivery' | 'pickup';
    deliveryAddress?: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
    totalAmount: number;
    paymentMethod: 'cash' | 'razorpay' | 'qr';
    paymentStatus: 'pending' | 'paid' | 'failed';
    notes?: string;
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    cancelReason?: string;
    rating?: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    product: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export interface CartItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    inStock: boolean;
}

export interface StoreAnalytics {
    period: number;
    overview: {
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        deliveryOrders: number;
        pickupOrders: number;
    };
    productDemand: ProductDemand[];
    salesTrend: SalesTrend[];
    topProducts: ProductDemand[];
    lowDemandProducts: ProductDemand[];
}

export interface ProductDemand {
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
}

export interface SalesTrend {
    date: string;
    orders: number;
    revenue: number;
}
