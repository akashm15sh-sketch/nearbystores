# User Data Access Guide

## Methods to View User Details

### 1. **Using the viewUsers.js Script** (Recommended for Development)

Run this command to see all user details in a formatted view:
```bash
cd /home/akashhalder/.gemini/antigravity/scratch/nearbyStores/backend
node viewUsers.js
```

**Shows:**
- Username, Email, Phone
- Password (hashed)
- Role (customer/admin)
- Location coordinates
- Verification status
- Created/Updated timestamps
- User preferences

---

### 2. **Using MongoDB Compass** (GUI Tool)

1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. Navigate to: `nearbyStores` database → `users` collection
4. View and edit users with a visual interface

**Benefits:**
- Visual interface
- Easy filtering and sorting
- Export data to JSON/CSV
- Edit documents directly

---

### 3. **Using MongoDB Shell (mongosh)**

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use nearbyStores

# View all users
db.users.find().pretty()

# View specific user by email
db.users.findOne({ email: "user@example.com" })

# Count total users
db.users.countDocuments()

# View only specific fields
db.users.find({}, { username: 1, email: 1, createdAt: 1 })
```

---

### 4. **Create an Admin Dashboard** (Future Enhancement)

You could create an admin panel in your frontend to view users:
- Add admin routes: `/admin/users`
- Create API endpoint: `GET /api/admin/users`
- Display users in a table with filters

---

## User Data Fields Available

Based on your User model:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique user identifier |
| `username` | String | Unique username (3-30 chars) |
| `email` | String | User's email address |
| `phone` | String | User's phone number |
| `password` | String | Hashed password (bcrypt) |
| `role` | String | 'customer' or 'admin' |
| `location.coordinates` | [Number] | [longitude, latitude] |
| `isVerified` | Boolean | Email/phone verification status |
| `preferences.emailNotifications` | Boolean | Email notification setting |
| `preferences.whatsappNotifications` | Boolean | WhatsApp notification setting |
| `preferences.proximityAlerts` | Boolean | Proximity alert setting |
| `createdAt` | Date | Account creation timestamp |
| `updatedAt` | Date | Last update timestamp |
| `lastNotificationSent` | Map | Last notification timestamps |

---

## Quick Commands

```bash
# View all users
node viewUsers.js

# Clear all users
node clearUsers.js

# Access MongoDB shell
mongosh
```

> **Note:** Passwords are stored as bcrypt hashes and cannot be reversed. You can only verify if a password matches the hash.
