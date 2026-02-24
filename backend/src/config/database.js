const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores', {
            // These options are no longer needed in Mongoose 6+
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Auto-migrate: drop old single-field unique indexes and sync new compound indexes
        try {
            const collection = conn.connection.db.collection('users');
            const indexes = await collection.indexes();
            const oldIndexes = ['email_1', 'username_1', 'phone_1'];
            for (const name of oldIndexes) {
                if (indexes.find(i => i.name === name)) {
                    await collection.dropIndex(name);
                    console.log(`🔄 Dropped old index: ${name}`);
                }
            }
            const User = require('../models/User');
            await User.syncIndexes();
            console.log('✅ User indexes synced (role-scoped)');
        } catch (indexErr) {
            console.log('⚠️ Index migration note:', indexErr.message);
        }
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
