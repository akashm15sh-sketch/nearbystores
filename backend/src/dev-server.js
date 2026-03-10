/**
 * Local development server
 * Run with: node src/dev-server.js or npm run dev
 * This adds Socket.io and server.listen() on top of the Express app
 */
const http = require('http');
const socketIo = require('socket.io');
const app = require('./server');

const server = http.createServer(app);

// Parse allowed origins from environment
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(url => url.trim());

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

// Socket.io for real-time updates (local dev only — not available on Vercel)
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });

    socket.on('store-status-update', (data) => {
        io.emit('store-status-changed', data);
    });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
