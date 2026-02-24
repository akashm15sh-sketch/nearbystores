require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const clearUsers = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores');
        console.log('✅ Connected to MongoDB');

        // Delete all users
        const result = await User.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} users from the database`);

        // Close connection
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing users:', error);
        process.exit(1);
    }
};

clearUsers();
