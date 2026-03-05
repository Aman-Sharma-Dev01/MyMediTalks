import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, Bookmark, MessageCircle, UserPlus, Trash2, CheckCheck, RefreshCw, Eye, X } from 'lucide-react';
import api from '../../lib/api';

interface Notification {
    _id: string;
    type: 'new_comment' | 'new_like' | 'new_save' | 'new_subscriber' | 'comment_reply';
    message: string;
    reader?: {
        _id: string;
        name: string;
        email: string;
        avatar: string;
    };
    article?: {
        _id: string;
        title: string;
        slug: string;
    };
    isRead: boolean;
    metadata?: any;
    createdAt: string;
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const clearAll = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;
        
        try {
            await api.delete('/notifications');
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_comment':
            case 'comment_reply':
                return <MessageCircle size={18} className="text-green-500" />;
            case 'new_like':
                return <Heart size={18} className="text-red-500" />;
            case 'new_save':
                return <Bookmark size={18} className="text-blue-500" />;
            case 'new_subscriber':
                return <UserPlus size={18} className="text-purple-500" />;
            default:
                return <Bell size={18} className="text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        return n.type === filter;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-display italic text-ink mb-2 flex items-center gap-3">
                        <Bell className="text-primary" /> Notifications
                        {unreadCount > 0 && (
                            <span className="text-sm font-sans bg-red-500 text-white px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-secondary font-hand">Activity on your blog</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchNotifications}
                        className="p-2 text-secondary hover:text-primary transition-colors rounded-lg border border-primary/10"
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            <CheckCheck size={16} /> Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} /> Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'new_comment', label: 'Comments' },
                    { key: 'new_like', label: 'Likes' },
                    { key: 'new_save', label: 'Saves' },
                    { key: 'new_subscriber', label: 'Subscribers' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${
                            filter === f.key
                                ? 'bg-primary text-white'
                                : 'bg-white text-secondary hover:bg-primary/5 border border-primary/10'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="text-center py-12 text-secondary italic">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-primary/10 p-12 text-center">
                    <Bell className="mx-auto text-secondary mb-4" size={48} />
                    <p className="text-secondary italic">
                        {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-colors ${
                                notification.isRead
                                    ? 'border-primary/10'
                                    : 'border-primary/30 bg-primary/5'
                            }`}
                        >
                            {/* Icon */}
                            <div className={`p-2 rounded-lg ${
                                notification.type === 'new_comment' || notification.type === 'comment_reply'
                                    ? 'bg-green-100'
                                    : notification.type === 'new_like'
                                    ? 'bg-red-100'
                                    : notification.type === 'new_save'
                                    ? 'bg-blue-100'
                                    : 'bg-purple-100'
                            }`}>
                                {getIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className={`text-sm ${notification.isRead ? 'text-secondary' : 'text-ink font-medium'}`}>
                                            {notification.message}
                                        </p>
                                        {notification.metadata?.preview && (
                                            <p className="text-xs text-secondary mt-1 italic truncate">
                                                "{notification.metadata.preview}"
                                            </p>
                                        )}
                                        {notification.article && (
                                            <Link
                                                to={`/admin/engagement/${notification.article._id}`}
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                                            >
                                                <Eye size={12} /> View engagement
                                            </Link>
                                        )}
                                    </div>
                                    <span className="text-xs text-secondary whitespace-nowrap">
                                        {formatDate(notification.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                {!notification.isRead && (
                                    <button
                                        onClick={() => markAsRead(notification._id)}
                                        className="p-1.5 text-secondary hover:text-primary transition-colors rounded"
                                        title="Mark as read"
                                    >
                                        <CheckCheck size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteNotification(notification._id)}
                                    className="p-1.5 text-secondary hover:text-red-500 transition-colors rounded"
                                    title="Delete"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
