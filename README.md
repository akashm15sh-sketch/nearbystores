# NearbyStores Platform

A comprehensive web platform connecting local stores with nearby customers, featuring real-time notifications, geolocation services, and store discovery.

## 🚀 Features

### For Customers
- **User Authentication**: Email/WhatsApp OTP-based registration and login
- **Store Discovery**: Browse nearby stores with Zomato-style layout
- **Category Filtering**: Filter stores by type (food, general, hardware, etc.)
- **Interactive Map**: View stores on OpenStreetMap with Leaflet
- **Store Details**: View products, schedules, and contact information
- **Proximity Alerts**: Get notified when passing by registered stores
- **Notification Preferences**: Customize email and proximity alert settings

### For Administrators
- **Store Management**: Add, edit, and delete stores
- **Product Management**: Manage store products and inventory
- **Status Updates**: Update store open/closed status in real-time
- **Custom Map Markers**: Add store locations without Google Maps

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom orange gradient theme
- **Leaflet + OpenStreetMap** for maps (100% free)
- **Zustand** for state management
- **React Hook Form** for form handling
- **Socket.io Client** for real-time updates

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.io** for real-time updates
- **Brevo API** for email notifications (300/day free)
- **Geospatial Queries** for proximity detection

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Brevo account (free) for email notifications
- Firebase account (free) for OTP authentication

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/nearbyStores
JWT_SECRET=your-secret-key
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@nearbystores.com
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔑 Getting API Keys

### Brevo (Email Service) - FREE
1. Sign up at https://www.brevo.com
2. Go to SMTP & API → API Keys
3. Create a new API key
4. Add to backend `.env` as `BREVO_API_KEY`

### Firebase (OTP Authentication) - FREE
1. Create project at https://firebase.google.com
2. Go to Project Settings → General
3. Copy configuration values
4. Add to frontend `.env.local`

### MongoDB Atlas (Database) - FREE
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Add to backend `.env` as `MONGODB_URI`

## 📱 Usage

### Customer Flow
1. **Register**: Enter email → Receive OTP → Create username/password
2. **Login**: Sign in with username and password
3. **Browse Stores**: View nearby stores on home page
4. **Filter**: Select category to filter stores
5. **View Details**: Click store to see products and schedules
6. **Map View**: See all stores on interactive map
7. **Profile**: Manage notification preferences

### Admin Flow
1. Login with admin account
2. Access admin panel from profile
3. Add/edit/delete stores
4. Update store status and products
5. Manage store locations on map

## 🗺️ Features Explained

### Proximity Alerts
- Automatically detects when users are within 500m of a store
- Sends email notification (with 24-hour cooldown)
- Requires user permission for location access
- Can be disabled in profile preferences

### Real-time Updates
- Store status changes broadcast via Socket.io
- Live updates on home page and store details
- No page refresh needed

### Geolocation
- Uses browser Geolocation API
- Calculates distances using Haversine formula
- MongoDB geospatial queries for efficient nearby search
- Sorts stores by distance from user

## 🎨 Design System

- **Primary Color**: Orange gradient (#ff9a56 to #ff6b35)
- **Background**: Light orange to white gradient
- **Typography**: Inter font family
- **Components**: Custom buttons, cards, badges, inputs
- **Animations**: Fade-in, slide-up, scale-in effects

## 📊 Database Schema

### User
- Username (unique)
- Email/Phone
- Password (hashed)
- Role (customer/admin)
- Location (GeoJSON Point)
- Notification preferences

### Store
- Name, category, description
- Location (GeoJSON Point with address)
- Weekly schedule
- Current status (open/closed/busy)
- Products array
- Contact information

### Notification
- User reference
- Store reference
- Type (proximity/status_change/general)
- Channel (email/whatsapp)
- Status (pending/sent/failed)

## 🚧 Limitations

- **WhatsApp Notifications**: Not implemented (requires paid service)
- **SMS OTP**: Not implemented (using email OTP instead)
- **Payment Integration**: Not included
- **Reviews/Ratings**: Basic rating field only
- **Image Upload**: Uses URLs (no file upload)

## 🔒 Security

- JWT tokens for authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Environment variable protection

## 📝 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/check-username/:username` - Check availability
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update preferences

### Stores
- `GET /api/stores` - Get all stores (with filters)
- `GET /api/stores/:id` - Get single store
- `POST /api/stores` - Create store (admin)
- `PUT /api/stores/:id` - Update store (admin)
- `DELETE /api/stores/:id` - Delete store (admin)
- `PATCH /api/stores/:id/status` - Update status (admin)
- `POST /api/stores/location` - Update user location

## 🤝 Contributing

This is a demo project. Feel free to fork and customize!

## 📄 License

MIT License

## 🙏 Acknowledgments

- OpenStreetMap for free map tiles
- Leaflet for map library
- Brevo for email service
- Firebase for authentication
