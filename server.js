import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import businessAuthRoutes from './routes/businessAuthRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://localhost:3000'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // For now, allow all during dev if above check fails to avoid blocking valid dev flows
            // In strict mode we would return error
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Serve static uploads
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Healthorate API is running',
        version: '1.0.0'
    });
});

// Customer routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Public routes
import publicRoutes from './routes/publicRoutes.js';
app.use('/api/public', publicRoutes);
import cartRoutes from './routes/cartRoutes.js';
app.use('/api/cart', cartRoutes);

// Business routes
app.use('/api/business/auth', businessAuthRoutes);
import testRoutes from './routes/testRoutes.js';
app.use('/api/business/tests', testRoutes);
import offerRoutes from './routes/offerRoutes.js';
app.use('/api/business/offers', offerRoutes);

// Admin routes
import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}\n`);
});
