import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    reader: { type: mongoose.Schema.Types.ObjectId, ref: 'Reader' },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribeToken: { type: String, unique: true, sparse: true },
    preferences: {
        newArticles: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: false }
    }
}, { timestamps: true });

// Generate unsubscribe token before saving
subscriberSchema.pre('save', function(next) {
    if (!this.unsubscribeToken) {
        this.unsubscribeToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    next();
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
