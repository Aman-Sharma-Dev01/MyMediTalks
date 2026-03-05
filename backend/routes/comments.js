import express from 'express';
import jwt from 'jsonwebtoken';
import Comment from '../models/Comment.js';
import Reader from '../models/Reader.js';
import Article from '../models/Article.js';
import Notification from '../models/Notification.js';
import { notifyCommentReply } from '../services/emailService.js';

const router = express.Router();

// Middleware to get reader from token (optional)
const getReader = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
            req.reader = await Reader.findById(decoded.readerId);
        }
    } catch (e) {
        // Continue without reader
    }
    next();
};

// Middleware to require reader authentication
const requireReader = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Comments - Token received:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
        
        if (!token) return res.status(401).json({ message: 'Login required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        console.log('Comments - Decoded:', decoded);
        
        req.reader = await Reader.findById(decoded.readerId);
        console.log('Comments - Reader found:', req.reader ? req.reader._id : 'NOT FOUND');
        
        if (!req.reader) return res.status(401).json({ message: 'Reader not found' });
        next();
    } catch (error) {
        console.error('Comments - Auth error:', error.message);
        res.status(401).json({ message: 'Invalid authentication' });
    }
};

// Get comments for an article
router.get('/article/:articleId', getReader, async (req, res) => {
    try {
        const comments = await Comment.find({ 
            article: req.params.articleId,
            parentComment: null // Only top-level comments
        })
            .populate('reader', 'name avatar')
            .populate({
                path: 'parentComment',
                populate: { path: 'reader', select: 'name avatar' }
            })
            .sort({ createdAt: -1 });

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
            const replies = await Comment.find({ parentComment: comment._id })
                .populate('reader', 'name avatar')
                .sort({ createdAt: 1 });
            
            return {
                ...comment.toObject(),
                replies,
                isLiked: req.reader ? comment.likes.includes(req.reader._id) : false,
                likeCount: comment.likes.length
            };
        }));

        res.json(commentsWithReplies);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Failed to load comments' });
    }
});

// Add a comment
router.post('/', requireReader, async (req, res) => {
    try {
        const { articleId, content, parentCommentId } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ message: 'Comment too long (max 2000 characters)' });
        }

        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const comment = await Comment.create({
            article: articleId,
            reader: req.reader._id,
            content: content.trim(),
            parentComment: parentCommentId || null
        });

        // Create notification for admin
        await Notification.create({
            type: parentCommentId ? 'comment_reply' : 'new_comment',
            message: `${req.reader.name} ${parentCommentId ? 'replied to a comment' : 'commented'} on "${article.title}"`,
            reader: req.reader._id,
            article: articleId,
            comment: comment._id,
            metadata: { preview: content.substring(0, 100) }
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate('reader', 'name avatar');

        res.status(201).json({
            ...populatedComment.toObject(),
            replies: [],
            isLiked: false,
            likeCount: 0
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
});

// Like/unlike a comment
router.post('/:commentId/like', requireReader, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const isLiked = comment.likes.includes(req.reader._id);
        
        if (isLiked) {
            comment.likes = comment.likes.filter(id => !id.equals(req.reader._id));
        } else {
            comment.likes.push(req.reader._id);
        }
        
        await comment.save();

        res.json({ 
            isLiked: !isLiked, 
            likeCount: comment.likes.length 
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update like' });
    }
});

// Delete own comment
router.delete('/:commentId', requireReader, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (!comment.reader.equals(req.reader._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete replies too
        await Comment.deleteMany({ parentComment: comment._id });
        await comment.deleteOne();

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete comment' });
    }
});

// Admin reply to comment (requires admin auth)
router.post('/:commentId/admin-reply', async (req, res) => {
    try {
        // Check admin token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Admin login required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        // This should check for admin role - you may need to adjust based on your admin auth
        
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Reply content required' });

        const comment = await Comment.findById(req.params.commentId)
            .populate('reader')
            .populate('article');
            
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        comment.adminReply = {
            content,
            repliedAt: new Date()
        };
        comment.isAdminReply = true;
        await comment.save();

        // Send email notification to the commenter
        if (comment.reader) {
            await notifyCommentReply(comment.reader, comment.article, content);
        }

        res.json(comment);
    } catch (error) {
        console.error('Admin reply error:', error);
        res.status(500).json({ message: 'Failed to add reply' });
    }
});

// Get comment count for article
router.get('/count/:articleId', async (req, res) => {
    try {
        const count = await Comment.countDocuments({ article: req.params.articleId });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get count' });
    }
});

// Admin: Get all comments
router.get('/admin/all', async (req, res) => {
    try {
        // Check admin token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Admin login required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        // Add admin role check if needed

        const comments = await Comment.find({ parentComment: null })
            .populate('reader', 'name email avatar')
            .populate('article', 'title slug')
            .sort({ createdAt: -1 });

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
            const replies = await Comment.find({ parentComment: comment._id })
                .populate('reader', 'name email avatar')
                .sort({ createdAt: 1 });

            return {
                ...comment.toObject(),
                replies,
                likeCount: comment.likes.length
            };
        }));

        res.json(commentsWithReplies);
    } catch (error) {
        console.error('Admin get comments error:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
});

// Admin: Like a comment (as admin)
router.post('/:commentId/admin-like', async (req, res) => {
    try {
        // Check admin token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Admin login required' });

        jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Use a special "admin" marker for admin likes
        const adminLikeId = 'admin_like';
        const isLiked = comment.likes.some(id => id.toString() === adminLikeId);

        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== adminLikeId);
        } else {
            comment.likes.push(adminLikeId);
        }

        await comment.save();

        res.json({
            isLiked: !isLiked,
            likeCount: comment.likes.length
        });
    } catch (error) {
        console.error('Admin like error:', error);
        res.status(500).json({ message: 'Failed to like comment' });
    }
});

// Admin: Delete any comment
router.delete('/admin/:commentId', async (req, res) => {
    try {
        // Check admin token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Admin login required' });

        jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');

        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Delete replies too
        await Comment.deleteMany({ parentComment: comment._id });
        await comment.deleteOne();

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Admin delete error:', error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
});

export default router;
