import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Reply, Trash2, Send, MessageCircle } from 'lucide-react';
import { useReaderAuth, getReaderToken } from '../lib/ReaderAuthContext';
import api from '../lib/api';

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  reader: {
    _id: string;
    name: string;
    avatar: string;
  };
  replies: Comment[];
  isLiked: boolean;
  likeCount: number;
  adminReply?: {
    content: string;
    repliedAt: string;
  };
}

interface CommentSectionProps {
  articleId: string;
  onLoginRequired: () => void;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  replyingTo: string | null;
  setReplyingTo: React.Dispatch<React.SetStateAction<string | null>>;
  replyContents: Record<string, string>;
  setReplyContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submitting: boolean;
  reader: { _id: string; name: string; avatar?: string } | null;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
  handleLikeComment: (commentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  handleSubmitReply: (parentId: string) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const CommentItem = memo(function CommentItem({
  comment,
  isReply = false,
  replyingTo,
  setReplyingTo,
  replyContents,
  setReplyContents,
  submitting,
  reader,
  isAuthenticated,
  onLoginRequired,
  handleLikeComment,
  handleDeleteComment,
  handleSubmitReply
}: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-12 mt-4' : 'border-b border-primary/10 pb-6'}`}
    >
      <div className="flex gap-4">
        <img
          src={comment.reader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.reader.name)}&background=d4a574&color=fff`}
          alt={comment.reader.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-ink">{comment.reader.name}</span>
            <span className="text-xs text-secondary">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-ink/80 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          
          {/* Admin Reply */}
          {comment.adminReply && (
            <div className="mt-3 p-3 bg-primary/5 rounded-xl border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Author Reply</span>
                <span className="text-xs text-secondary">{formatDate(comment.adminReply.repliedAt)}</span>
              </div>
              <p className="text-ink/80 text-sm">{comment.adminReply.content}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => handleLikeComment(comment._id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                comment.isLiked ? 'text-red-500' : 'text-secondary hover:text-red-500'
              }`}
            >
              <Heart size={16} className={comment.isLiked ? 'fill-current' : ''} />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </button>
            
            {!isReply && (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onLoginRequired();
                    return;
                  }
                  setReplyingTo(replyingTo === comment._id ? null : comment._id);
                }}
                className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors"
              >
                <Reply size={16} />
                <span>Reply</span>
              </button>
            )}

            {reader && comment.reader._id === reader._id && (
              <button
                onClick={() => handleDeleteComment(comment._id)}
                className="flex items-center gap-1 text-sm text-secondary hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Reply Form */}
          <AnimatePresence>
            {replyingTo === comment._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="flex gap-3">
                  <img
                    src={reader?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader?.name || 'U')}&background=d4a574&color=fff`}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={replyContents[comment._id] || ''}
                      onChange={(e) => setReplyContents(prev => ({ ...prev, [comment._id]: e.target.value }))}
                      placeholder="Write a reply..."
                      className="flex-1 bg-white border border-primary/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(comment._id)}
                    />
                    <button
                      onClick={() => handleSubmitReply(comment._id)}
                      disabled={!(replyContents[comment._id] || '').trim() || submitting}
                      className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  isReply
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContents={replyContents}
                  setReplyContents={setReplyContents}
                  submitting={submitting}
                  reader={reader}
                  isAuthenticated={isAuthenticated}
                  onLoginRequired={onLoginRequired}
                  handleLikeComment={handleLikeComment}
                  handleDeleteComment={handleDeleteComment}
                  handleSubmitReply={handleSubmitReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default function CommentSection({ articleId, onLoginRequired }: CommentSectionProps) {
  const { reader, isAuthenticated } = useReaderAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const token = getReaderToken();
      const { data } = await api.get(`/comments/article/${articleId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const token = getReaderToken();
      console.log('Comment submit - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('isAuthenticated:', isAuthenticated);
      
      if (!token) {
        console.error('No token available for comment');
        onLoginRequired();
        return;
      }
      
      const { data } = await api.post('/comments', {
        articleId,
        content: newComment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments([data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    const content = replyContents[parentId] || '';
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const token = getReaderToken();
      const { data } = await api.post('/comments', {
        articleId,
        content: content.trim(),
        parentCommentId: parentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments(comments.map(c => 
        c._id === parentId 
          ? { ...c, replies: [...c.replies, data] }
          : c
      ));
      setReplyContents(prev => ({ ...prev, [parentId]: '' }));
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }

    try {
      const token = getReaderToken();
      const { data } = await api.post(`/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments(comments.map(c => {
        if (c._id === commentId) {
          return { ...c, isLiked: data.isLiked, likeCount: data.likeCount };
        }
        return {
          ...c,
          replies: c.replies.map(r => 
            r._id === commentId 
              ? { ...r, isLiked: data.isLiked, likeCount: data.likeCount }
              : r
          )
        };
      }));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const token = getReaderToken();
      await api.delete(`/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComments(comments.filter(c => c._id !== commentId).map(c => ({
        ...c,
        replies: c.replies.filter(r => r._id !== commentId)
      })));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="mt-16 pt-8 border-t border-primary/20">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="text-primary" size={24} />
        <h3 className="text-2xl font-display font-medium text-ink">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-8">
        <div className="flex gap-4">
          {isAuthenticated ? (
            <img
              src={reader?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader?.name || 'U')}&background=d4a574&color=fff`}
              alt="You"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onClick={() => !isAuthenticated && onLoginRequired()}
              placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to comment..."}
              className="w-full bg-white border border-primary/20 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-primary transition-colors"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-secondary">{newComment.length}/2000</span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting || !isAuthenticated}
                className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium text-sm flex items-center gap-2"
              >
                <Send size={16} />
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 text-secondary">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-secondary">
          <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-lg">No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContents={replyContents}
              setReplyContents={setReplyContents}
              submitting={submitting}
              reader={reader}
              isAuthenticated={isAuthenticated}
              onLoginRequired={onLoginRequired}
              handleLikeComment={handleLikeComment}
              handleDeleteComment={handleDeleteComment}
              handleSubmitReply={handleSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
