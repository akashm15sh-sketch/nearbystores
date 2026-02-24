const Store = require('../models/Store');
const GeolocationService = require('../services/geolocation.service');

// Global search for stores and products
exports.globalSearch = async (req, res) => {
    try {
        const { q, lat, lng, maxDistance = 10000, category } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchQuery = q.trim();
        const searchRegex = new RegExp(searchQuery, 'i');

        // Build base query for approved stores
        let storeQuery = {
            approvalStatus: 'approved',
            $or: [
                { name: searchRegex },
                { category: searchRegex },
                { description: searchRegex },
                { 'products.name': searchRegex }
            ]
        };

        // Add category filter if provided
        if (category && category !== 'all') {
            storeQuery.category = category;
        }

        // Add location filter if coordinates provided
        if (lat && lng) {
            const userLocation = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };

            storeQuery.location = {
                $near: {
                    $geometry: userLocation,
                    $maxDistance: parseInt(maxDistance)
                }
            };
        }

        // Search stores
        const stores = await Store.find(storeQuery)
            .select('name category location products contact rating')
            .limit(20);

        // Extract matching products from stores
        const productResults = [];
        stores.forEach(store => {
            if (store.products && store.products.length > 0) {
                const matchingProducts = store.products.filter(product =>
                    product.name.match(searchRegex) ||
                    (product.description && product.description.match(searchRegex))
                );

                matchingProducts.forEach(product => {
                    productResults.push({
                        productId: product._id,
                        productName: product.name,
                        price: product.price,
                        inStock: product.inStock,
                        store: {
                            id: store._id,
                            name: store.name,
                            category: store.category
                        }
                    });
                });
            }
        });

        // Calculate distances if location provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);

            stores.forEach(store => {
                if (store.location && store.location.coordinates) {
                    const [storeLng, storeLat] = store.location.coordinates;
                    store._doc.distance = GeolocationService.calculateDistance(
                        userLat,
                        userLng,
                        storeLat,
                        storeLng
                    );
                }
            });
        }

        res.json({
            query: searchQuery,
            results: {
                stores: stores.map(store => ({
                    id: store._id,
                    name: store.name,
                    category: store.category,
                    location: store.location,
                    distance: store._doc.distance,
                    rating: store.rating,
                    contact: store.contact
                })),
                products: productResults
            },
            totalStores: stores.length,
            totalProducts: productResults.length
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};

// Search within a specific store
exports.storeSearch = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const searchQuery = q.trim();
        const searchRegex = new RegExp(searchQuery, 'i');

        // Filter products
        const matchingProducts = store.products.filter(product =>
            product.name.match(searchRegex) ||
            (product.description && product.description.match(searchRegex)) ||
            (product.category && product.category.match(searchRegex))
        );

        res.json({
            query: searchQuery,
            store: {
                id: store._id,
                name: store.name,
                category: store.category
            },
            products: matchingProducts,
            totalResults: matchingProducts.length
        });
    } catch (error) {
        console.error('Store search error:', error);
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};

module.exports = exports;
