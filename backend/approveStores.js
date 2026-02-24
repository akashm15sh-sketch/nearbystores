require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('./src/models/Store');

async function approveExistingStores() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores');
        console.log('✅ Connected to MongoDB\n');

        // Find all stores
        const stores = await Store.find({});

        console.log(`📦 Found ${stores.length} store(s)\n`);

        // Approve all existing stores
        for (const store of stores) {
            if (store.approvalStatus !== 'approved') {
                store.approvalStatus = 'approved';
                store.isVerified = true;
                store.verifiedAt = new Date();

                // Set default icon based on category
                const iconMap = {
                    'food': 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
                    'general': 'https://cdn-icons-png.flaticon.com/512/2331/2331966.png',
                    'hardware': 'https://cdn-icons-png.flaticon.com/512/2910/2910768.png',
                    'other': 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png'
                };

                store.icon = iconMap[store.category] || iconMap['other'];

                await store.save();

                console.log(`✅ Approved: ${store.name}`);
                console.log(`   Category: ${store.category}`);
                console.log(`   Icon: ${store.icon}`);
                console.log(`   Status: ${store.approvalStatus}\n`);
            } else {
                console.log(`ℹ️  Already approved: ${store.name}\n`);
            }
        }

        console.log('✨ All stores have been approved and icons set!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

approveExistingStores();
