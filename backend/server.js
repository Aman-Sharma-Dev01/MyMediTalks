import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/uploadRoutes.js';
import healthRoutes from './routes/health.js';
import readerAuthRoutes from './routes/readerAuth.js';
import commentsRoutes from './routes/comments.js';
import interactionsRoutes from './routes/interactions.js';
import notificationsRoutes from './routes/notifications.js';
// Patch for CommonJS export in ES module
const _healthRoutes = healthRoutes.default || healthRoutes;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'https://mymeditalks.vercel.app',
    'https://www.mymeditalks.in',
    'https://mymeditalks.in',
    'https://mymeditalks.pages.dev'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mymeditalks')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reader', readerAuthRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api', _healthRoutes);

app.get('/', (req, res) => {
    res.send('MyMediTalks API Running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
