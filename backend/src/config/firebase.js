const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// For production, set FIREBASE_SERVICE_ACCOUNT env var with the JSON string of your service account key
// For development/simple setup, we use the project ID only (sufficient for verifying tokens)
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccount) {
        // Full service account key provided
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
    } else {
        // Minimal setup — works for token verification if FIREBASE_PROJECT_ID is set
        admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'nearbystores',
        });
    }
}

module.exports = admin;
