import mongoose from 'mongoose';

const readerSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: '' },
    isSubscribed: { type: Boolean, default: false },
    savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
    likedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
    notificationPreferences: {
        newArticles: { type: Boolean, default: true },
        commentReplies: { type: Boolean, default: true }
    }
}, { timestamps: true });

const Reader = mongoose.model('Reader', readerSchema);
export default Reader;
