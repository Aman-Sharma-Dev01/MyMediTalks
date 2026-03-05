import express from 'express';
import Article from '../models/Article.js';
import Reader from '../models/Reader.js';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/authMiddleware.js';
import { notifyNewArticle } from '../services/emailService.js';

const router = express.Router();

// @desc    Get all public articles (published & scheduled if past date)
// @route   GET /api/articles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const articles = await Article.find({
            $or: [
                { status: 'published' },
                { status: 'scheduled', publishedAt: { $lte: new Date() } }
            ]
        })
            .populate('author', 'name avatar role')
            .sort({ publishedAt: -1, createdAt: -1 });

        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

// @desc    Get single article by slug
// @route   GET /api/articles/:slug
// @access  Public
router.get('/:slug', async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug })
            .populate('author', 'name avatar role bio');

        if (!article) return res.status(404).json({ message: 'Article not found' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

// @desc    Increment view count for article
// @route   POST /api/articles/:slug/view
// @access  Public
router.post('/:slug/view', async (req, res) => {
    try {
        const article = await Article.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!article) return res.status(404).json({ message: 'Article not found' });
        res.json({ views: article.views });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

// @desc    Get all articles (for admin dashboard including drafts)
// @route   GET /api/articles/admin/all
// @access  Private
router.get('/admin/all', protect, async (req, res) => {
    try {
        const articles = await Article.find({})
            .populate('author', 'name')
            .sort({ createdAt: -1 });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

// @desc    Get single article by ID for editing
// @route   GET /api/articles/admin/:id
// @access  Private
router.get('/admin/:id', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to update this article' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});

// @desc    Get engagement for a specific article
// @route   GET /api/articles/admin/:id/engagement
// @access  Private
router.get('/admin/:id/engagement', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        // Find readers who liked this article
        const likedBy = await Reader.find(
            { likedArticles: article._id },
            'name email avatar'
        );

        // Find readers who saved this article
        const savedBy = await Reader.find(
            { savedArticles: article._id },
            'name email avatar'
        );

        // Get comments with reader info
        const comments = await Comment.find({ article: article._id })
            .populate('reader', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json({
            _id: article._id,
            title: article.title,
            slug: article.slug,
            views: article.views || 0,
            likeCount: likedBy.length,
            saveCount: savedBy.length,
            commentCount: comments.length,
            likedBy,
            savedBy,
            comments
        });
    } catch (error) {
        console.error('Article engagement fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch engagement' });
    }
});

// @desc    Create an article
// @route   POST /api/articles
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const article = new Article({
            ...req.body,
            author: req.user._id,
        });

        const createdArticle = await article.save();
        
        // Notify subscribers if article is published immediately
        if (createdArticle.status === 'published') {
            notifyNewArticle(createdArticle).catch(err => console.error('Failed to notify subscribers:', err));
        }
        
        res.status(201).json(createdArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update an article
// @route   PUT /api/articles/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) return res.status(404).json({ message: 'Article not found' });

        // Make sure user owns the article (or is admin)
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to update this article' });
        }

        const wasPublished = article.status === 'published';
        Object.assign(article, req.body);
        const updatedArticle = await article.save();

        // Notify subscribers if article was just published (draft -> published)
        if (!wasPublished && updatedArticle.status === 'published') {
            notifyNewArticle(updatedArticle).catch(err => console.error('Failed to notify subscribers:', err));
        }

        res.json(updatedArticle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) return res.status(404).json({ message: 'Article not found' });

        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await article.deleteOne();
        res.json({ message: 'Article removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get engagement data for all articles (likes, saves, comments)
// @route   GET /api/articles/admin/engagement
// @access  Admin
router.get('/admin/engagement', protect, async (req, res) => {
    try {
        // Get all articles
        const articles = await Article.find().sort({ createdAt: -1 });

        // Get engagement data for each article
        const engagementData = await Promise.all(articles.map(async (article) => {
            // Find readers who liked this article
            const likedBy = await Reader.find(
                { likedArticles: article._id },
                'name email avatar'
            );

            // Find readers who saved this article
            const savedBy = await Reader.find(
                { savedArticles: article._id },
                'name email avatar'
            );

            // Count comments
            const commentCount = await Comment.countDocuments({ article: article._id });

            return {
                _id: article._id,
                title: article.title,
                slug: article.slug,
                views: article.views || 0,
                likeCount: likedBy.length,
                saveCount: savedBy.length,
                commentCount,
                likedBy,
                savedBy
            };
        }));

        res.json(engagementData);
    } catch (error) {
        console.error('Engagement fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch engagement data' });
    }
});

export default router;
