require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('./src/models/Store');

async function updateStoreLocationPrecise() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores');
        console.log('✅ Connected to MongoDB\n');

        // Find the demo store
        const store = await Store.findOne({ name: 'Fresh Mart Grocery Store' });
        if (!store) {
            console.log('❌ Demo store not found. Please run createDemoStore.js first.');
            process.exit(1);
        }

        console.log('📍 Current Store Location:');
        console.log(`   Coordinates: [${store.location.coordinates[0]}, ${store.location.coordinates[1]}]`);
        console.log(`   Address: ${store.location.address}\n`);

        // User's location (from localStorage - Gandhinagar area)
        const userLat = 23.2156;  // User's actual latitude
        const userLng = 72.6508;  // User's actual longitude

        console.log('👤 User Location:');
        console.log(`   Coordinates: [${userLng}, ${userLat}]\n`);

        // Generate location within 5-8km of user (well within 10km range)
        // Using more accurate calculation
        const distanceKm = 5 + Math.random() * 3; // 5-8 km
        const bearing = Math.random() * 2 * Math.PI; // Random direction

        // Convert to radians
        const R = 6371; // Earth's radius in km
        const lat1 = userLat * Math.PI / 180;
        const lng1 = userLng * Math.PI / 180;

        // Calculate new position
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / R) +
            Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing));
        const lng2 = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
            Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2));

        const newLat = lat2 * 180 / Math.PI;
        const newLng = lng2 * 180 / Math.PI;

        console.log('🎲 Generating random location within 10km...\n');

        // Update store location
        store.location.coordinates = [newLng, newLat];
        store.location.address = `Shop No. 15, Sector ${Math.floor(Math.random() * 30) + 1}, Gandhinagar, Gujarat 382010`;

        await store.save();

        console.log('✨ Store Location Updated Successfully! ✨\n');
        console.log('📍 New Store Location:');
        console.log(`   Coordinates: [${store.location.coordinates[0].toFixed(6)}, ${store.location.coordinates[1].toFixed(6)}]`);
        console.log(`   Address: ${store.location.address}\n`);

        // Verify distance calculation
        const dLat = (newLat - userLat) * Math.PI / 180;
        const dLon = (newLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(newLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        console.log(`📏 Distance from user: ${distance.toFixed(2)} km`);

        if (distance <= 10) {
            console.log(`✅ Store is within 10km range!`);
        } else {
            console.log(`⚠️  Warning: Store is ${distance.toFixed(2)}km away (outside 10km range)`);
        }

        console.log(`\n🗺️  The store should now be visible on the map.`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

updateStoreLocationPrecise();
