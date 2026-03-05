import express from 'express';
import jwt from 'jsonwebtoken';
import Reader from '../models/Reader.js';
import Article from '../models/Article.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Middleware to require reader authentication
const requireReader = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Interactions - Token received:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
        
        if (!token) return res.status(401).json({ message: 'Login required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        console.log('Interactions - Decoded:', decoded);
        
        req.reader = await Reader.findById(decoded.readerId);
        console.log('Interactions - Reader found:', req.reader ? req.reader._id : 'NOT FOUND');
        
        if (!req.reader) return res.status(401).json({ message: 'Reader not found' });
        next();
    } catch (error) {
        console.error('Interactions - Auth error:', error.message);
        res.status(401).json({ message: 'Invalid authentication' });
    }
};

// Like/unlike an article
router.post('/like/:articleId', requireReader, async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        const isLiked = req.reader.likedArticles.includes(article._id);

        if (isLiked) {
            req.reader.likedArticles = req.reader.likedArticles.filter(
                id => !id.equals(article._id)
            );
        } else {
            req.reader.likedArticles.push(article._id);
            
            // Create notification for new like
            await Notification.create({
                type: 'new_like',
                message: `${req.reader.name} liked "${article.title}"`,
                reader: req.reader._id,
                article: article._id
            });
        }

        await req.reader.save();

        // Get total likes count
        const likeCount = await Reader.countDocuments({ likedArticles: article._id });

        res.json({ 
            isLiked: !isLiked,
            likeCount
        });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ message: 'Failed to update like' });
    }
});

// Save/unsave an article
router.post('/save/:articleId', requireReader, async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        const isSaved = req.reader.savedArticles.includes(article._id);

        if (isSaved) {
            req.reader.savedArticles = req.reader.savedArticles.filter(
                id => !id.equals(article._id)
            );
        } else {
            req.reader.savedArticles.push(article._id);
            
            // Create notification for new save
            await Notification.create({
                type: 'new_save',
                message: `${req.reader.name} saved "${article.title}"`,
                reader: req.reader._id,
                article: article._id
            });
        }

        await req.reader.save();

        res.json({ isSaved: !isSaved });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ message: 'Failed to save article' });
    }
});

// Get saved articles
router.get('/saved', requireReader, async (req, res) => {
    try {
        const reader = await Reader.findById(req.reader._id)
            .populate({
                path: 'savedArticles',
                select: 'title slug excerpt coverImage category readTime createdAt',
                options: { sort: { createdAt: -1 } }
            });

        res.json(reader.savedArticles);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get saved articles' });
    }
});

// Get liked articles
router.get('/liked', requireReader, async (req, res) => {
    try {
        const reader = await Reader.findById(req.reader._id)
            .populate({
                path: 'likedArticles',
                select: 'title slug excerpt coverImage category readTime createdAt',
                options: { sort: { createdAt: -1 } }
            });

        res.json(reader.likedArticles);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get liked articles' });
    }
});

// Check interaction status for an article
router.get('/status/:articleId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        // Get total likes count
        const likeCount = await Reader.countDocuments({ likedArticles: req.params.articleId });
        
        if (!token) {
            return res.json({ 
                isLiked: false, 
                isSaved: false, 
                likeCount,
                isLoggedIn: false 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
            const reader = await Reader.findById(decoded.readerId);
            
            if (!reader) {
                return res.json({ 
                    isLiked: false, 
                    isSaved: false, 
                    likeCount,
                    isLoggedIn: false 
                });
            }

            res.json({
                isLiked: reader.likedArticles.some(id => id.equals(req.params.articleId)),
                isSaved: reader.savedArticles.some(id => id.equals(req.params.articleId)),
                likeCount,
                isLoggedIn: true
            });
        } catch (e) {
            return res.json({ 
                isLiked: false, 
                isSaved: false, 
                likeCount,
                isLoggedIn: false 
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to get status' });
    }
});

export default router;
