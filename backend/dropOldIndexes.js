/**
 * Migration: Drop old unique indexes on email/username/phone
 * and let Mongoose create new compound indexes (email+role, username+role, phone+role)
 * 
 * Run once: node dropOldIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.db.collection('users');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => `${i.name}: ${JSON.stringify(i.key)}`));

    // Drop old single-field unique indexes
    const toDrop = ['email_1', 'username_1', 'phone_1'];
    for (const name of toDrop) {
        try {
            await collection.dropIndex(name);
            console.log(`✅ Dropped index: ${name}`);
        } catch (err) {
            console.log(`⚠️ Index ${name} not found (already dropped or never existed)`);
        }
    }

    // Force Mongoose to sync new indexes
    const User = require('./src/models/User');
    await User.syncIndexes();
    console.log('✅ New compound indexes synced');

    // Verify
    const newIndexes = await collection.indexes();
    console.log('New indexes:', newIndexes.map(i => `${i.name}: ${JSON.stringify(i.key)} unique:${i.unique || false}`));

    await mongoose.disconnect();
    console.log('Done!');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
