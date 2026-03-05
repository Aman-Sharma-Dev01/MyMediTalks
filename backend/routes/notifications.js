import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all notifications (admin only)
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('reader', 'name email avatar')
            .populate('article', 'title slug')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get count' });
    }
});

// Mark notification as read
router.patch('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notification' });
    }
});

// Mark all as read
router.patch('/mark-all-read', protect, async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notifications' });
    }
});

// Delete a notification
router.delete('/:id', protect, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete notification' });
    }
});

// Clear all notifications
router.delete('/', protect, async (req, res) => {
    try {
        await Notification.deleteMany({});
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear notifications' });
    }
});

export default router;
