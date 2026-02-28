import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
    heroTitle: { type: String, default: 'MyMediTalks' },
    heroSubtitle: { type: String, default: 'Volume II: The Healing Arts' },
    heroQuote: { type: String, default: 'Exploring the intersections of biological science and human experience through the lens of a botanical illustrator.' },
    footerQuote: { type: String, default: 'Medicine is an art form practiced on the canvas of life. Join me in sketching out the wonders of our biology.' },
    footerTitle: { type: String, default: 'A letter from the gardener...' },
    dailyDoseQuote: { type: String, default: '"Remember to breathe as deeply as the roots reach."' },
    sketchbookNotesQuote: { type: String, default: '"The way a leaf veins mirror the bronchial tree of our lungs is not a coincidence, but a conversation in the language of growth."' },
    sketchbookNotesAuthor: { type: String, default: 'Dr. Aria Thorne, 2023' },
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
