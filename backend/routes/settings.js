import express from 'express';
import SiteSettings from '../models/SiteSettings.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
router.get('/', async (req, res) => {
    try {
        let settings = await SiteSettings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await SiteSettings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private
router.put('/', protect, async (req, res) => {
    try {
        let settings = await SiteSettings.findOne();
        if (!settings) {
            settings = new SiteSettings();
        }

        Object.assign(settings, req.body);
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
