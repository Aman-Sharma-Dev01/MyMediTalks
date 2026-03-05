import React, { useEffect, useState } from 'react';
import { MessageCircle, Heart, Bookmark, Send, ThumbsUp, Trash2, ChevronDown, ChevronUp, User, Eye, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

interface Reader {
    _id: string;
    name: string;
    email: string;
    avatar: string;
}

interface Comment {
    _id: string;
    content: string;
    reader: Reader;
    article: {
        _id: string;
        title: string;
        slug: string;
    };
    likes: string[];
    likeCount: number;
    adminReply?: {
        content: string;
        repliedAt: string;
    };
    createdAt: string;
    replies?: Comment[];
}

interface ArticleEngagement {
    _id: string;
    title: string;
    slug: string;
    views: number;
    likeCount: number;
    saveCount: number;
    commentCount: number;
    likedBy: Reader[];
    savedBy: Reader[];
}

type TabType = 'comments' | 'engagement';

export default function AdminEngagement() {
    const [activeTab, setActiveTab] = useState<TabType>('comments');
    const [comments, setComments] = useState<Comment[]>([]);
    const [engagementData, setEngagementData] = useState<ArticleEngagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<{ [key: string]: 'likes' | 'saves' | null }>({});

    useEffect(() => {
        if (activeTab === 'comments') {
            fetchComments();
        } else {
            fetchEngagement();
        }
    }, [activeTab]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/comments/admin/all');
            setComments(data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEngagement = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/articles/admin/engagement');
            setEngagementData(data);
        } catch (error) {
            console.error('Failed to fetch engagement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminReply = async (commentId: string) => {
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            await api.post(`/comments/${commentId}/admin-reply`, {
                content: replyContent.trim()
            });
            setReplyContent('');
            setReplyingTo(null);
            fetchComments();
        } catch (error) {
            console.error('Failed to reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            await api.post(`/comments/${commentId}/admin-like`);
            fetchComments();
        } catch (error) {
            console.error('Failed to like comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment? This will also delete all replies.')) return;

        try {
            await api.delete(`/comments/admin/${commentId}`);
            fetchComments();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const toggleArticleExpand = (articleId: string) => {
        setExpandedArticle(expandedArticle === articleId ? null : articleId);
    };

    const toggleSection = (articleId: string, section: 'likes' | 'saves') => {
        setExpandedSection(prev => ({
            ...prev,
            [articleId]: prev[articleId] === section ? null : section
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-display italic text-ink mb-2">Engagement</h1>
                    <p className="text-secondary font-hand">Comments, likes & saves</p>
                </div>
                <button
                    onClick={() => activeTab === 'comments' ? fetchComments() : fetchEngagement()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-primary/10 mb-8 px-2">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === 'comments' ? 'text-ink' : 'text-secondary hover:text-primary'}`}
                >
                    <MessageCircle size={16} /> Comments
                    {activeTab === 'comments' && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('engagement')}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === 'engagement' ? 'text-ink' : 'text-secondary hover:text-primary'}`}
                >
                    <Heart size={16} /> Article Stats
                    {activeTab === 'engagement' && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></span>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-secondary italic text-center">Loading...</div>
            ) : activeTab === 'comments' ? (
                /* Comments Tab */
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-primary/10 p-12 text-center">
                            <MessageCircle className="mx-auto text-secondary mb-4" size={48} />
                            <p className="text-secondary italic">No comments yet</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment._id} className="bg-white rounded-2xl shadow-sm border border-primary/10 p-6">
                                {/* Comment Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={comment.reader?.avatar || 'https://via.placeholder.com/40'}
                                            alt={comment.reader?.name || 'User'}
                                            className="w-10 h-10 rounded-full object-cover border border-primary/20"
                                        />
                                        <div>
                                            <p className="font-semibold text-ink">{comment.reader?.name || 'Unknown User'}</p>
                                            <p className="text-xs text-secondary">{comment.reader?.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-secondary">{formatDate(comment.createdAt)}</p>
                                        <a
                                            href={`/article/${comment.article?.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1 justify-end mt-1"
                                        >
                                            <Eye size={12} /> {comment.article?.title}
                                        </a>
                                    </div>
                                </div>

                                {/* Comment Content */}
                                <p className="text-ink mb-4 bg-cream/50 rounded-xl p-4">{comment.content}</p>

                                {/* Comment Actions */}
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={() => handleLikeComment(comment._id)}
                                        className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
                                    >
                                        <ThumbsUp size={16} /> {comment.likeCount || 0}
                                    </button>
                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                        className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
                                    >
                                        <MessageCircle size={16} /> Reply
                                    </button>
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="flex items-center gap-1 text-sm text-red-400 hover:text-red-600 transition-colors ml-auto"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>

                                {/* Admin Reply Input */}
                                {replyingTo === comment._id && (
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Write an admin reply..."
                                            className="flex-1 px-4 py-2 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAdminReply(comment._id)}
                                        />
                                        <button
                                            onClick={() => handleAdminReply(comment._id)}
                                            disabled={submitting || !replyContent.trim()}
                                            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-ink transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Send size={16} /> {submitting ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                )}

                                {/* Existing Admin Reply */}
                                {comment.adminReply && (
                                    <div className="bg-primary/5 rounded-xl p-4 border-l-4 border-primary">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Admin Reply</span>
                                            <span className="text-xs text-secondary">• {formatDate(comment.adminReply.repliedAt)}</span>
                                        </div>
                                        <p className="text-ink">{comment.adminReply.content}</p>
                                    </div>
                                )}

                                {/* Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-4 pl-6 border-l-2 border-primary/10 space-y-3">
                                        {comment.replies.map((reply) => (
                                            <div key={reply._id} className="bg-cream/30 rounded-xl p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <img
                                                        src={reply.reader?.avatar || 'https://via.placeholder.com/24'}
                                                        alt={reply.reader?.name || 'User'}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                    <span className="text-sm font-medium text-ink">{reply.reader?.name}</span>
                                                    <span className="text-xs text-secondary">{formatDate(reply.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-ink">{reply.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Engagement Stats Tab */
                <div className="space-y-4">
                    {engagementData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-primary/10 p-12 text-center">
                            <Heart className="mx-auto text-secondary mb-4" size={48} />
                            <p className="text-secondary italic">No engagement data yet</p>
                        </div>
                    ) : (
                        engagementData.map((article) => (
                            <div key={article._id} className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
                                {/* Article Header */}
                                <button
                                    onClick={() => toggleArticleExpand(article._id)}
                                    className="w-full p-6 flex items-center justify-between hover:bg-cream/30 transition-colors"
                                >
                                    <div className="text-left">
                                        <h3 className="font-display text-lg text-ink font-medium">{article.title}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1 text-sm text-secondary">
                                                <Eye size={14} className="text-purple-400" /> {article.views.toLocaleString()} views
                                            </span>
                                            <span className="flex items-center gap-1 text-sm text-secondary">
                                                <Heart size={14} className="text-red-400" /> {article.likeCount} likes
                                            </span>
                                            <span className="flex items-center gap-1 text-sm text-secondary">
                                                <Bookmark size={14} className="text-blue-400" /> {article.saveCount} saves
                                            </span>
                                            <span className="flex items-center gap-1 text-sm text-secondary">
                                                <MessageCircle size={14} className="text-green-400" /> {article.commentCount} comments
                                            </span>
                                        </div>
                                    </div>
                                    {expandedArticle === article._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>

                                {/* Expanded Details */}
                                {expandedArticle === article._id && (
                                    <div className="border-t border-primary/10 p-6">
                                        {/* Likes Section */}
                                        <div className="mb-4">
                                            <button
                                                onClick={() => toggleSection(article._id, 'likes')}
                                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-2"
                                            >
                                                <Heart size={14} /> Who Liked ({article.likeCount})
                                                {expandedSection[article._id] === 'likes' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {expandedSection[article._id] === 'likes' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                    {article.likedBy.length === 0 ? (
                                                        <p className="text-secondary text-sm italic">No likes yet</p>
                                                    ) : (
                                                        article.likedBy.map((reader) => (
                                                            <div key={reader._id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                                                <img
                                                                    src={reader.avatar || 'https://via.placeholder.com/32'}
                                                                    alt={reader.name}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-medium text-ink">{reader.name}</p>
                                                                    <p className="text-xs text-secondary">{reader.email}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Saves Section */}
                                        <div>
                                            <button
                                                onClick={() => toggleSection(article._id, 'saves')}
                                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-2"
                                            >
                                                <Bookmark size={14} /> Who Saved ({article.saveCount})
                                                {expandedSection[article._id] === 'saves' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {expandedSection[article._id] === 'saves' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                    {article.savedBy.length === 0 ? (
                                                        <p className="text-secondary text-sm italic">No saves yet</p>
                                                    ) : (
                                                        article.savedBy.map((reader) => (
                                                            <div key={reader._id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                                                <img
                                                                    src={reader.avatar || 'https://via.placeholder.com/32'}
                                                                    alt={reader.name}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-medium text-ink">{reader.name}</p>
                                                                    <p className="text-xs text-secondary">{reader.email}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
