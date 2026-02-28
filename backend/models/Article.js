import mongoose from 'mongoose';
import slugify from 'slugify'; // Need to install this or use simple regex

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    category: { type: String, required: true },
    readTime: { type: String },
    tags: [{ type: String }],
    status: {
        type: String,
        enum: ['draft', 'published', 'scheduled'],
        default: 'draft'
    },
    publishedAt: { type: Date },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Auto-generate slug if not provided/modified
articleSchema.pre('validate', function () {
    if (this.title && !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
});

const Article = mongoose.model('Article', articleSchema);
export default Article;
