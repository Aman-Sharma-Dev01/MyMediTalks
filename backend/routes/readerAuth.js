import express from 'express';
import jwt from 'jsonwebtoken';
import Reader from '../models/Reader.js';
import Subscriber from '../models/Subscriber.js';
import Notification from '../models/Notification.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// Google OAuth Login/Register
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, name, avatar } = req.body;

        if (!googleId || !email || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find or create reader
        let reader = await Reader.findOne({ googleId });
        let isNewUser = false;

        if (!reader) {
            isNewUser = true;
            // Create new reader with subscription enabled by default
            reader = await Reader.create({
                googleId,
                email,
                name,
                avatar: avatar || '',
                isSubscribed: true // Auto-subscribe new users
            });

            // Auto-create subscriber entry
            let subscriber = await Subscriber.findOne({ email });
            if (!subscriber) {
                subscriber = await Subscriber.create({
                    email,
                    name,
                    reader: reader._id,
                    isActive: true
                });
                // Send welcome email
                sendWelcomeEmail(subscriber).catch(err => console.error('Welcome email failed:', err));
                
                // Create notification for new subscriber
                await Notification.create({
                    type: 'new_subscriber',
                    message: `${name} joined your newsletter`,
                    reader: reader._id,
                    metadata: { email }
                });
            } else {
                // Link existing subscriber to reader
                subscriber.reader = reader._id;
                subscriber.isActive = true;
                await subscriber.save();
            }
        } else {
            // Update existing reader's info
            reader.name = name;
            reader.avatar = avatar || reader.avatar;
            await reader.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { readerId: reader._id },
            process.env.JWT_SECRET || 'mysecretkey',
            { expiresIn: '30d' }
        );

        res.json({
            token,
            reader: {
                _id: reader._id,
                name: reader.name,
                email: reader.email,
                avatar: reader.avatar,
                isSubscribed: reader.isSubscribed,
                savedArticles: reader.savedArticles,
                likedArticles: reader.likedArticles
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
});

// Get current reader profile
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        const reader = await Reader.findById(decoded.readerId)
            .populate('savedArticles', 'title slug excerpt coverImage category')
            .populate('likedArticles', 'title slug');

        if (!reader) return res.status(404).json({ message: 'Reader not found' });

        res.json({
            _id: reader._id,
            name: reader.name,
            email: reader.email,
            avatar: reader.avatar,
            isSubscribed: reader.isSubscribed,
            savedArticles: reader.savedArticles,
            likedArticles: reader.likedArticles,
            notificationPreferences: reader.notificationPreferences
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if already subscribed
        let subscriber = await Subscriber.findOne({ email });
        
        if (subscriber) {
            if (subscriber.isActive) {
                return res.status(400).json({ message: 'Already subscribed!' });
            }
            // Reactivate subscription
            subscriber.isActive = true;
            await subscriber.save();
        } else {
            // Create new subscriber
            subscriber = await Subscriber.create({ email, name });
            
            // Send welcome email (fire and forget - don't block subscription)
            sendWelcomeEmail(subscriber).catch(err => console.error('Welcome email failed:', err));
        }

        // If there's a logged-in reader, link subscription
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
                const reader = await Reader.findById(decoded.readerId);
                if (reader) {
                    reader.isSubscribed = true;
                    await reader.save();
                    subscriber.reader = reader._id;
                    await subscriber.save();
                }
            } catch (e) {
                // Token invalid, continue without linking
            }
        }

        res.json({ message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
});

// Unsubscribe from newsletter
router.get('/unsubscribe/:token', async (req, res) => {
    try {
        const subscriber = await Subscriber.findOne({ unsubscribeToken: req.params.token });
        
        if (!subscriber) {
            return res.status(404).json({ message: 'Invalid unsubscribe link' });
        }

        subscriber.isActive = false;
        await subscriber.save();

        // Also update reader if linked
        if (subscriber.reader) {
            await Reader.findByIdAndUpdate(subscriber.reader, { isSubscribed: false });
        }

        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
});

// Authenticated user unsubscribe
router.post('/unsubscribe', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        const reader = await Reader.findById(decoded.readerId);
        
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }

        // Update reader subscription status
        reader.isSubscribed = false;
        await reader.save();

        // Also update subscriber record if exists
        const subscriber = await Subscriber.findOne({ email: reader.email });
        if (subscriber) {
            subscriber.isActive = false;
            await subscriber.save();
        }

        res.json({ message: 'Unsubscribed successfully', isSubscribed: false });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
});

// Authenticated user resubscribe
router.post('/resubscribe', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        const reader = await Reader.findById(decoded.readerId);
        
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }

        // Update reader subscription status
        reader.isSubscribed = true;
        await reader.save();

        // Also update subscriber record if exists, or create one
        let subscriber = await Subscriber.findOne({ email: reader.email });
        if (subscriber) {
            subscriber.isActive = true;
            await subscriber.save();
        } else {
            subscriber = await Subscriber.create({
                email: reader.email,
                name: reader.name,
                reader: reader._id,
                isActive: true
            });
        }

        res.json({ message: 'Subscribed successfully', isSubscribed: true });
    } catch (error) {
        console.error('Resubscribe error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
});

// Update notification preferences
router.put('/preferences', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        const reader = await Reader.findByIdAndUpdate(
            decoded.readerId,
            { notificationPreferences: req.body },
            { new: true }
        );

        res.json({ notificationPreferences: reader.notificationPreferences });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update preferences' });
    }
});

export default router;
