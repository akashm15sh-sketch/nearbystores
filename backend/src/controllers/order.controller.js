const Order = require('../models/Order');
const Store = require('../models/Store');
const notificationService = require('../services/notification.service');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { storeId, items, orderType, deliveryAddress, deliveryLocation, notes, paymentMethod } = req.body;

        // Validate store exists
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Validate payment method is supported by store
        if (paymentMethod === 'qr' && !store.paymentMethods?.upiId) {
            return res.status(400).json({ message: 'QR payment not available for this store' });
        }
        if (paymentMethod === 'razorpay' && !store.paymentMethods?.razorpayEnabled) {
            return res.status(400).json({ message: 'Online payment not available for this store' });
        }
        if (paymentMethod === 'cash' && store.paymentMethods?.cashOnDelivery === false) {
            return res.status(400).json({ message: 'Cash on delivery not available for this store' });
        }

        // Calculate subtotals
        const orderItems = items.map(item => ({
            product: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        }));

        // Create order
        const order = await Order.create({
            customer: req.user.id,
            store: storeId,
            items: orderItems,
            orderType,
            deliveryAddress,
            deliveryLocation: deliveryLocation || undefined,
            notes,
            paymentMethod,
            estimatedDeliveryTime: orderType === 'delivery'
                ? new Date(Date.now() + 45 * 60 * 1000) // 45 minutes
                : new Date(Date.now() + 20 * 60 * 1000) // 20 minutes
        });

        // Send notification to customer
        if (req.user.email && req.user.preferences?.emailNotifications) {
            await notificationService.sendOrderConfirmation(
                req.user.email,
                order._id,
                store.name,
                order.totalAmount,
                order.orderType
            );
        }

        res.status(201).json({
            message: 'Order placed successfully',
            order: await order.populate('store', 'name location contact')
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

// Get customer orders
exports.getCustomerOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { customer: req.user.id };

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('store', 'name location images')
            .sort({ createdAt: -1 });

        res.json({ orders, count: orders.length });
    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ message: 'Failed to get orders', error: error.message });
    }
};

// Get store orders (for store owners/admins)
exports.getStoreOrders = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { status, startDate, endDate } = req.query;

        const query = { store: storeId };

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('customer', 'username email phone')
            .sort({ createdAt: -1 });

        res.json({ orders, count: orders.length });
    } catch (error) {
        console.error('Get store orders error:', error);
        res.status(500).json({ message: 'Failed to get orders', error: error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId).populate('customer store');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;

        if (status === 'completed') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();

        // Send status update notification
        if (order.customer.email && order.customer.preferences?.emailNotifications) {
            await notificationService.sendOrderStatusUpdate(
                order.customer.email,
                order._id,
                order.store.name,
                status
            );
        }

        res.json({ message: 'Order status updated', order });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
};

// Update order status (store owner — only their own store's orders)
exports.updateOrderStatusPartner = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        // Find order and verify it belongs to the partner's store
        const order = await Order.findById(orderId).populate('store');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Make sure the logged-in user owns the store this order is for
        if (order.store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. This order is not for your store.' });
        }

        order.status = status;

        if (status === 'completed') {
            order.actualDeliveryTime = new Date();
            // Auto-mark cash payments as paid on completion
            if (order.paymentMethod === 'cash') {
                order.paymentStatus = 'paid';
            }
        }

        await order.save();

        res.json({ message: 'Order status updated', order });
    } catch (error) {
        console.error('Partner update order status error:', error);
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
};

// Get order analytics for a store
exports.getStoreAnalytics = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { period = '30' } = req.query; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get orders in period
        const orders = await Order.find({
            store: storeId,
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' }
        });

        // Product demand analysis
        const productStats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productStats[item.productName]) {
                    productStats[item.productName] = {
                        name: item.productName,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        orderCount: 0
                    };
                }
                productStats[item.productName].totalQuantity += item.quantity;
                productStats[item.productName].totalRevenue += item.subtotal;
                productStats[item.productName].orderCount += 1;
            });
        });

        // Convert to array and sort by demand
        const productDemand = Object.values(productStats)
            .sort((a, b) => b.totalQuantity - a.totalQuantity);

        // Overall statistics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Order type distribution
        const deliveryOrders = orders.filter(o => o.orderType === 'delivery').length;
        const pickupOrders = orders.filter(o => o.orderType === 'pickup').length;

        // Daily sales trend
        const dailySales = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailySales[date]) {
                dailySales[date] = { date, orders: 0, revenue: 0 };
            }
            dailySales[date].orders += 1;
            dailySales[date].revenue += order.totalAmount;
        });

        const salesTrend = Object.values(dailySales).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        res.json({
            period: parseInt(period),
            overview: {
                totalOrders,
                totalRevenue,
                averageOrderValue,
                deliveryOrders,
                pickupOrders
            },
            productDemand,
            salesTrend,
            topProducts: productDemand.slice(0, 10),
            lowDemandProducts: productDemand.slice(-10).reverse()
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Failed to get analytics', error: error.message });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Only allow cancellation if order is pending or confirmed
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
        }

        order.status = 'cancelled';
        order.cancelReason = reason;
        await order.save();

        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Failed to cancel order', error: error.message });
    }
};
