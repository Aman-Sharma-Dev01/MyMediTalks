
import express from 'express';
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

export default router;
