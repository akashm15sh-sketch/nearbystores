require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('./src/models/Store');
const User = require('./src/models/User');

const DEMO_STORE_DATA = {
    name: 'Fresh Mart Grocery Store',
    category: 'general',
    description: 'Your one-stop shop for fresh groceries, daily essentials, and household items. We pride ourselves on quality products at affordable prices with excellent customer service.',
    images: [
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'
    ],
    location: {
        type: 'Point',
        coordinates: [72.5714, 23.0225], // Gandhinagar, Gujarat
        address: 'Shop No. 15, Sector 10, Gandhinagar, Gujarat 382010'
    },
    schedule: {
        monday: { open: '08:00', close: '22:00', isOpen: true },
        tuesday: { open: '08:00', close: '22:00', isOpen: true },
        wednesday: { open: '08:00', close: '22:00', isOpen: true },
        thursday: { open: '08:00', close: '22:00', isOpen: true },
        friday: { open: '08:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '23:00', isOpen: true },
        sunday: { open: '09:00', close: '21:00', isOpen: true }
    },
    currentStatus: 'open',
    products: [
        // Fresh Produce
        {
            name: 'Fresh Tomatoes (1kg)',
            price: 40,
            image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
            inStock: true
        },
        {
            name: 'Onions (1kg)',
            price: 30,
            image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
            inStock: true
        },
        {
            name: 'Fresh Bananas (1 dozen)',
            price: 50,
            image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400',
            inStock: true
        },
        {
            name: 'Green Apples (1kg)',
            price: 120,
            image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
            inStock: true
        },
        {
            name: 'Fresh Carrots (500g)',
            price: 25,
            image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
            inStock: true
        },

        // Dairy Products
        {
            name: 'Amul Fresh Milk (1L)',
            price: 62,
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
            inStock: true
        },
        {
            name: 'Amul Butter (100g)',
            price: 55,
            image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
            inStock: true
        },
        {
            name: 'Curd (500g)',
            price: 35,
            image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
            inStock: true
        },

        // Packaged Goods
        {
            name: 'Tata Salt (1kg)',
            price: 22,
            image: 'https://images.unsplash.com/photo-1598485477000-f6b43a5d3a9e?w=400',
            inStock: true
        },
        {
            name: 'Fortune Sunflower Oil (1L)',
            price: 145,
            image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
            inStock: true
        },
        {
            name: 'India Gate Basmati Rice (5kg)',
            price: 450,
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
            inStock: true
        },
        {
            name: 'Aashirvaad Atta (5kg)',
            price: 240,
            image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
            inStock: true
        },

        // Beverages
        {
            name: 'Coca Cola (2L)',
            price: 90,
            image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
            inStock: true
        },
        {
            name: 'Real Fruit Juice (1L)',
            price: 110,
            image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
            inStock: true
        },
        {
            name: 'Tata Tea Gold (500g)',
            price: 225,
            image: 'https://images.unsplash.com/photo-1597318114064-1e6f8d6f1b7c?w=400',
            inStock: true
        },

        // Snacks
        {
            name: 'Lays Chips (100g)',
            price: 20,
            image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
            inStock: true
        },
        {
            name: 'Parle-G Biscuits (200g)',
            price: 25,
            image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
            inStock: true
        },
        {
            name: 'Maggi Noodles (Pack of 12)',
            price: 144,
            image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
            inStock: true
        },

        // Household Items
        {
            name: 'Vim Dishwash Bar (300g)',
            price: 35,
            image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400',
            inStock: true
        },
        {
            name: 'Surf Excel Detergent (1kg)',
            price: 180,
            image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400',
            inStock: false  // Out of stock example
        }
    ],
    contact: {
        phone: '+91 79 2325 1234',
        email: 'freshmart.gandhinagar@example.com',
        whatsapp: '+91 98765 43210'
    },
    rating: 4.6
};

async function createDemoStore() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbyStores');
        console.log('✅ Connected to MongoDB');

        // Check if demo store already exists
        const existingStore = await Store.findOne({ name: DEMO_STORE_DATA.name });
        if (existingStore) {
            console.log('⚠️  Demo store already exists. Deleting old version...');
            await Store.deleteOne({ _id: existingStore._id });
        }

        // Find or create a demo owner user
        let owner = await User.findOne({ email: 'owner@freshmart.com' });
        if (!owner) {
            console.log('👤 Creating demo store owner...');
            owner = await User.create({
                username: 'freshmart_owner',
                name: 'Fresh Mart Owner',
                email: 'owner@freshmart.com',
                password: 'demo123',
                role: 'admin',
                phone: '+91 98765 43210'
            });
            console.log('✅ Demo owner created');
        }

        // Create the demo store
        console.log('🏪 Creating demo store...');
        const store = await Store.create({
            ...DEMO_STORE_DATA,
            owner: owner._id
        });

        console.log('\n✨ Demo Store Created Successfully! ✨\n');
        console.log('📍 Store Details:');
        console.log(`   Name: ${store.name}`);
        console.log(`   Category: ${store.category}`);
        console.log(`   Location: ${store.location.address}`);
        console.log(`   Products: ${store.products.length} items`);
        console.log(`   Rating: ${store.rating} ⭐`);
        console.log(`   Status: ${store.currentStatus}`);
        console.log(`\n📞 Contact:`);
        console.log(`   Phone: ${store.contact.phone}`);
        console.log(`   Email: ${store.contact.email}`);
        console.log(`   WhatsApp: ${store.contact.whatsapp}`);
        console.log(`\n🕐 Operating Hours:`);
        console.log(`   Mon-Fri: ${store.schedule.monday.open} - ${store.schedule.monday.close}`);
        console.log(`   Saturday: ${store.schedule.saturday.open} - ${store.schedule.saturday.close}`);
        console.log(`   Sunday: ${store.schedule.sunday.open} - ${store.schedule.sunday.close}`);
        console.log(`\n📦 Sample Products:`);
        store.products.slice(0, 5).forEach(product => {
            console.log(`   - ${product.name}: ₹${product.price} ${product.inStock ? '✅' : '❌ Out of Stock'}`);
        });
        console.log(`   ... and ${store.products.length - 5} more items`);
        console.log(`\n🎉 You can now view this store on the map and place orders!`);
        console.log(`   Store ID: ${store._id}`);

    } catch (error) {
        console.error('❌ Error creating demo store:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

// Run the script
createDemoStore();
