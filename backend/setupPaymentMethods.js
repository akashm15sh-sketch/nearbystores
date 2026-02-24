require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('./src/models/Store');

async function setupPaymentMethods() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores');
        console.log('✅ Connected to MongoDB\n');

        // Find all stores
        const stores = await Store.find({});

        console.log(`📦 Found ${stores.length} store(s)\n`);

        // Update payment methods for each store
        for (const store of stores) {
            // Set default payment methods
            store.paymentMethods = {
                upiId: 'freshmart@upi', // Demo UPI ID
                qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=freshmart@upi&pn=Fresh%20Mart&am=0&cu=INR',
                razorpayEnabled: true,
                cashOnDelivery: true
            };

            await store.save();

            console.log(`✅ Updated payment methods for: ${store.name}`);
            console.log(`   UPI ID: ${store.paymentMethods.upiId}`);
            console.log(`   QR Code: ${store.paymentMethods.qrCodeUrl}`);
            console.log(`   Razorpay: ${store.paymentMethods.razorpayEnabled ? 'Enabled' : 'Disabled'}`);
            console.log(`   Cash on Delivery: ${store.paymentMethods.cashOnDelivery ? 'Enabled' : 'Disabled'}\n`);
        }

        console.log('✨ All stores have been configured with payment methods!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

setupPaymentMethods();
