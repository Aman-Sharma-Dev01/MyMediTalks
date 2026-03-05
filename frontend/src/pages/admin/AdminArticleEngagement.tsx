import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, Bookmark, MessageCircle, Send, Trash2, ThumbsUp, RefreshCw } from 'lucide-react';
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
    likes: string[];
    adminReply?: {
        content: string;
        repliedAt: string;
    };
    createdAt: string;
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
    comments: Comment[];
}

export default function AdminArticleEngagement() {
    const { id } = useParams();
    const [engagement, setEngagement] = useState<ArticleEngagement | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEngagement();
    }, [id]);

    const fetchEngagement = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/articles/admin/${id}/engagement`);
            setEngagement(data);
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
            fetchEngagement();
        } catch (error) {
            console.error('Failed to reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await api.delete(`/comments/admin/${commentId}`);
            fetchEngagement();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
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

    if (loading) {
        return <div className="p-8 text-secondary italic">Loading engagement data...</div>;
    }

    if (!engagement) {
        return <div className="p-8 text-secondary italic">Article not found.</div>;
    }

    return (
        <div className="p-8 md:p-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    to="/admin"
                    className="p-2 text-secondary hover:text-primary transition-colors bg-white rounded-lg border border-primary/10 shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-display italic text-ink">{engagement.title}</h1>
                    <p className="text-secondary text-sm mt-1">Article Engagement Analytics</p>
                </div>
                <button
                    onClick={fetchEngagement}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Eye size={20} className="text-purple-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary">Views</span>
                    </div>
                    <p className="text-3xl font-bold text-ink">{engagement.views.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Heart size={20} className="text-red-500" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary">Likes</span>
                    </div>
                    <p className="text-3xl font-bold text-ink">{engagement.likeCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bookmark size={20} className="text-blue-500" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary">Saves</span>
                    </div>
                    <p className="text-3xl font-bold text-ink">{engagement.saveCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-primary/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MessageCircle size={20} className="text-green-500" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary">Comments</span>
                    </div>
                    <p className="text-3xl font-bold text-ink">{engagement.commentCount}</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Who Liked */}
                <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-primary/10 bg-red-50">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-red-700 flex items-center gap-2">
                            <Heart size={16} /> Who Liked ({engagement.likeCount})
                        </h3>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                        {engagement.likedBy.length === 0 ? (
                            <p className="text-secondary text-sm italic">No likes yet</p>
                        ) : (
                            <div className="space-y-3">
                                {engagement.likedBy.map((reader) => (
                                    <div key={reader._id} className="flex items-center gap-3">
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
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Who Saved */}
                <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-primary/10 bg-blue-50">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-blue-700 flex items-center gap-2">
                            <Bookmark size={16} /> Who Saved ({engagement.saveCount})
                        </h3>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                        {engagement.savedBy.length === 0 ? (
                            <p className="text-secondary text-sm italic">No saves yet</p>
                        ) : (
                            <div className="space-y-3">
                                {engagement.savedBy.map((reader) => (
                                    <div key={reader._id} className="flex items-center gap-3">
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
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-primary/10 bg-green-50">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-green-700 flex items-center gap-2">
                        <MessageCircle size={16} /> Comments ({engagement.commentCount})
                    </h3>
                </div>
                <div className="p-4">
                    {engagement.comments.length === 0 ? (
                        <p className="text-secondary text-sm italic text-center py-8">No comments yet</p>
                    ) : (
                        <div className="space-y-4">
                            {engagement.comments.map((comment) => (
                                <div key={comment._id} className="bg-cream/30 rounded-xl p-4">
                                    {/* Comment Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={comment.reader?.avatar || 'https://via.placeholder.com/40'}
                                                alt={comment.reader?.name || 'User'}
                                                className="w-10 h-10 rounded-full object-cover border border-primary/20"
                                            />
                                            <div>
                                                <p className="font-semibold text-ink text-sm">{comment.reader?.name || 'Unknown'}</p>
                                                <p className="text-xs text-secondary">{formatDate(comment.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-secondary flex items-center gap-1">
                                                <ThumbsUp size={12} /> {comment.likes?.length || 0}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comment Content */}
                                    <p className="text-ink text-sm mb-3">{comment.content}</p>

                                    {/* Admin Reply */}
                                    {comment.adminReply ? (
                                        <div className="bg-primary/5 rounded-lg p-3 border-l-4 border-primary">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold uppercase tracking-widest text-primary">Your Reply</span>
                                                <span className="text-xs text-secondary">• {formatDate(comment.adminReply.repliedAt)}</span>
                                            </div>
                                            <p className="text-sm text-ink">{comment.adminReply.content}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {replyingTo === comment._id ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="flex-1 px-3 py-2 text-sm border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAdminReply(comment._id)}
                                                    />
                                                    <button
                                                        onClick={() => handleAdminReply(comment._id)}
                                                        disabled={submitting || !replyContent.trim()}
                                                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-ink transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                                                    >
                                                        <Send size={14} /> Reply
                                                    </button>
                                                    <button
                                                        onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                                        className="px-3 py-2 text-secondary hover:text-ink transition-colors text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setReplyingTo(comment._id)}
                                                    className="text-xs text-primary hover:text-ink transition-colors font-medium"
                                                >
                                                    Reply to this comment
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* View Article Link */}
            <div className="mt-8 text-center">
                <a
                    href={`/article/${engagement.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-ink transition-colors text-sm font-medium"
                >
                    <Eye size={16} /> View Published Article
                </a>
            </div>
        </div>
    );
}
