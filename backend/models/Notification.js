import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['new_comment', 'new_like', 'new_save', 'new_subscriber', 'comment_reply'],
        required: true
    },
    message: { type: String, required: true },
    reader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reader'
    },
    article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
