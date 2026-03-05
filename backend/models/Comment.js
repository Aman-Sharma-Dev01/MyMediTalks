import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    article: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Article', 
        required: true 
    },
    reader: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Reader', 
        required: true 
    },
    content: { type: String, required: true, maxlength: 2000 },
    parentComment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment',
        default: null 
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reader' }],
    isAdminReply: { type: Boolean, default: false },
    adminReply: {
        content: { type: String },
        repliedAt: { type: Date }
    }
}, { timestamps: true });

// Virtual for reply count
commentSchema.virtual('replyCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment',
    count: true
});

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
