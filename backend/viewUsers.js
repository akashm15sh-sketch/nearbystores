require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const viewUsers = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores');
        console.log('✅ Connected to MongoDB\n');

        // Fetch all users (including password field)
        const users = await User.find({}).select('+password');

        if (users.length === 0) {
            console.log('📭 No users found in the database');
        } else {
            console.log(`👥 Found ${users.length} user(s):\n`);
            console.log('='.repeat(80));

            users.forEach((user, index) => {
                console.log(`\n👤 User #${index + 1}`);
                console.log('-'.repeat(80));
                console.log(`ID:               ${user._id}`);
                console.log(`Username:         ${user.username}`);
                console.log(`Email:            ${user.email || 'N/A'}`);
                console.log(`Phone:            ${user.phone || 'N/A'}`);
                console.log(`Password (Hash):  ${user.password}`);
                console.log(`Role:             ${user.role}`);
                console.log(`Verified:         ${user.isVerified ? '✅' : '❌'}`);
                console.log(`Location:         [${user.location.coordinates[0]}, ${user.location.coordinates[1]}]`);
                console.log(`Created At:       ${user.createdAt}`);
                console.log(`Last Updated:     ${user.updatedAt}`);
                console.log('\nPreferences:');
                console.log(`  Email Notifications:     ${user.preferences.emailNotifications ? '✅' : '❌'}`);
                console.log(`  WhatsApp Notifications:  ${user.preferences.whatsappNotifications ? '✅' : '❌'}`);
                console.log(`  Proximity Alerts:        ${user.preferences.proximityAlerts ? '✅' : '❌'}`);
                console.log('='.repeat(80));
            });
        }

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error viewing users:', error);
        process.exit(1);
    }
};

viewUsers();
