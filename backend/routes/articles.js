import express from 'express';
import Article from '../models/Article.js';
import { protect } from '../middleware/authMiddleware.js';

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

        Object.assign(article, req.body);
        const updatedArticle = await article.save();

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

export default router;
