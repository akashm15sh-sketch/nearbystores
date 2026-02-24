const Store = require('../models/Store');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationService = require('./notification.service');

class GeolocationService {
    constructor() {
        this.proximityRadius = parseInt(process.env.PROXIMITY_RADIUS_METERS) || 500; // meters
        this.cooldownHours = parseInt(process.env.PROXIMITY_COOLDOWN_HOURS) || 24;
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Find stores near a location
    async findNearbyStores(longitude, latitude, maxDistance = 10000) {
        try {
            const stores = await Store.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                }
            });

            // Add distance to each store
            return stores.map(store => {
                const distance = this.calculateDistance(
                    latitude,
                    longitude,
                    store.location.coordinates[1],
                    store.location.coordinates[0]
                );

                return {
                    ...store.toObject(),
                    distance: Math.round(distance)
                };
            });
        } catch (error) {
            console.error('Error finding nearby stores:', error);
            throw error;
        }
    }

    // Check for proximity alerts
    async checkProximityAlerts(userId, longitude, latitude) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.preferences.proximityAlerts) {
                return [];
            }

            // Find stores within proximity radius
            const nearbyStores = await Store.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: this.proximityRadius
                    }
                }
            });

            const alerts = [];

            for (const store of nearbyStores) {
                // Check if notification was sent recently (cooldown)
                const lastNotification = user.lastNotificationSent.get(store._id.toString());
                const cooldownMs = this.cooldownHours * 60 * 60 * 1000;

                if (lastNotification && Date.now() - lastNotification.getTime() < cooldownMs) {
                    continue; // Skip if within cooldown period
                }

                // Send proximity alert
                if (user.preferences.emailNotifications && user.email) {
                    try {
                        await notificationService.sendProximityAlert(
                            user.email,
                            store.name,
                            store.location.address
                        );

                        // Create notification record
                        await Notification.create({
                            user: userId,
                            store: store._id,
                            type: 'proximity',
                            message: `You're near ${store.name}`,
                            channel: 'email',
                            status: 'sent',
                            sentAt: new Date()
                        });

                        // Update last notification time
                        user.lastNotificationSent.set(store._id.toString(), new Date());
                        await user.save();

                        alerts.push({
                            store: store.name,
                            distance: this.calculateDistance(
                                latitude,
                                longitude,
                                store.location.coordinates[1],
                                store.location.coordinates[0]
                            )
                        });
                    } catch (error) {
                        console.error('Failed to send proximity alert:', error);
                    }
                }
            }

            return alerts;
        } catch (error) {
            console.error('Error checking proximity alerts:', error);
            throw error;
        }
    }

    // Update user location
    async updateUserLocation(userId, longitude, latitude) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    }
                },
                { new: true }
            );

            // Check for proximity alerts
            if (user.preferences.proximityAlerts) {
                await this.checkProximityAlerts(userId, longitude, latitude);
            }

            return user;
        } catch (error) {
            console.error('Error updating user location:', error);
            throw error;
        }
    }
}

module.exports = new GeolocationService();
