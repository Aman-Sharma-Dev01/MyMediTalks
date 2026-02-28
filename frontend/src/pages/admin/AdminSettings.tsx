import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

export default function AdminSettings() {
    const { user, login } = useAuth();
    const [profileMsg, setProfileMsg] = useState('');
    const [siteMsg, setSiteMsg] = useState('');

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [aboutText, setAboutText] = useState(user?.aboutText || '');
    const [professionalPath, setProfessionalPath] = useState<{ year: string, title: string, subtitle: string }[]>(
        user?.professionalPath || [
            { year: '2018 — Present', title: 'Attending Cardiologist', subtitle: "St. Mary's Teaching Hospital" },
            { year: '2015', title: 'Fellowship in Narrative Medicine', subtitle: 'Columbia University' }
        ]
    );
    const [aboutImages, setAboutImages] = useState<{ url: string, alt: string }[]>(
        user?.aboutImages || []
    );
    const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

    // Site Settings State
    const [siteParams, setSiteParams] = useState({
        heroTitle: '',
        heroSubtitle: '',
        heroQuote: '',
        footerQuote: '',
        footerTitle: '',
        dailyDoseQuote: '',
        sketchbookNotesQuote: '',
        sketchbookNotesAuthor: ''
    });

    useEffect(() => {
        fetchSiteSettings();
    }, []);

    const fetchSiteSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setSiteParams({
                heroTitle: data.heroTitle || '',
                heroSubtitle: data.heroSubtitle || '',
                heroQuote: data.heroQuote || '',
                footerQuote: data.footerQuote || '',
                footerTitle: data.footerTitle || '',
                dailyDoseQuote: data.dailyDoseQuote || '"Remember to breathe as deeply as the roots reach."',
                sketchbookNotesQuote: data.sketchbookNotesQuote || '"The way a leaf veins mirror the bronchial tree of our lungs is not a coincidence, but a conversation in the language of growth."',
                sketchbookNotesAuthor: data.sketchbookNotesAuthor || 'Dr. Aria Thorne, 2023'
            });
        } catch (error) {
            console.error("Failed to load site settings");
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/auth/profile', { name, bio, avatar, aboutText, professionalPath, aboutImages });
            login(data.token, data); // update context
            setProfileMsg('Profile updated successfully');
            setTimeout(() => setProfileMsg(''), 3000);
        } catch (err) {
            setProfileMsg('Failed to update profile');
        }
    };

    const handlePathChange = (index: number, field: string, value: string) => {
        const newPath = [...professionalPath];
        newPath[index] = { ...newPath[index], [field]: value };
        setProfessionalPath(newPath);
    };

    const addPathEntry = () => {
        setProfessionalPath([...professionalPath, { year: '', title: '', subtitle: '' }]);
    };

    const removePathEntry = (index: number) => {
        setProfessionalPath(professionalPath.filter((_, i) => i !== index));
    };

    const handleSiteSettingsUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/settings', siteParams);
            setSiteMsg('Site settings updated successfully');
            setTimeout(() => setSiteMsg(''), 3000);
        } catch (err) {
            setSiteMsg('Failed to update settings');
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploadingGalleryImage(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await api.post('/upload', formData, config);
            setAboutImages([...aboutImages, { url: data.url, alt: 'About Page Image' }]);
        } catch (error) {
            console.error('Image upload failed', error);
            setProfileMsg('Failed to upload gallery image');
        } finally {
            setUploadingGalleryImage(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        setAboutImages(aboutImages.filter((_, i) => i !== index));
    };

    const handleGalleryAltChange = (index: number, alt: string) => {
        const newImages = [...aboutImages];
        newImages[index].alt = alt;
        setAboutImages(newImages);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploadingAvatar(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await api.post('/upload', formData, config);
            setAvatar(data.url);
        } catch (error) {
            console.error('Image upload failed', error);
            setProfileMsg('Failed to upload image');
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-12">
            <div>
                <h1 className="text-4xl font-display italic text-ink mb-2">Settings</h1>
                <p className="text-secondary font-hand">Manage author profile and journal appearance</p>
            </div>

            {/* Author Profile section */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-primary/10">
                <h2 className="text-2xl font-display text-ink mb-6 border-b border-primary/10 pb-4">Author Profile</h2>
                {profileMsg && <div className="mb-4 text-sm font-bold text-green-600 uppercase tracking-widest">{profileMsg}</div>}

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Display Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Profile Photo (Upload)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploadingAvatar}
                            className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {uploadingAvatar && <p className="text-xs text-primary mt-2">Uploading...</p>}
                        <div className="mt-4 flex items-center gap-4">
                            <img src={avatar || 'https://via.placeholder.com/150'} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover border border-primary/20" />
                            <p className="text-xs text-secondary italic">Current Avatar Preview</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Short Bio (Sidebar)</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">About Page Introduction text</label>
                        <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={5} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary"></textarea>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary">Professional Path Timeline</label>
                            <button type="button" onClick={addPathEntry} className="text-xs font-bold text-primary border border-primary/20 px-3 py-1 rounded hover:bg-primary/5">
                                + Add Entry
                            </button>
                        </div>
                        <div className="space-y-4">
                            {professionalPath.map((entry, idx) => (
                                <div key={idx} className="flex gap-4 items-start bg-cream/50 p-4 rounded-lg border border-primary/10">
                                    <div className="flex-1 space-y-3">
                                        <input type="text" placeholder="Year (e.g., 2018 - Present)" value={entry.year} onChange={e => handlePathChange(idx, 'year', e.target.value)} className="w-full bg-white border border-primary/20 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary" />
                                        <input type="text" placeholder="Title (e.g., Attending Cardiologist)" value={entry.title} onChange={e => handlePathChange(idx, 'title', e.target.value)} className="w-full bg-white border border-primary/20 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary" />
                                        <input type="text" placeholder="Subtitle (e.g., St. Mary's Teaching Hospital)" value={entry.subtitle} onChange={e => handlePathChange(idx, 'subtitle', e.target.value)} className="w-full bg-white border border-primary/20 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary" />
                                    </div>
                                    <button type="button" onClick={() => removePathEntry(idx)} className="text-red-500 hover:text-red-700 p-2">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary">About Page Image Gallery</label>
                            <label className="cursor-pointer text-xs font-bold text-primary border border-primary/20 px-3 py-1 rounded hover:bg-primary/5">
                                {uploadingGalleryImage ? 'Uploading...' : '+ Add Image'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleGalleryUpload} disabled={uploadingGalleryImage} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {aboutImages.map((img, idx) => (
                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-primary/20 aspect-[4/3]">
                                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <button type="button" onClick={() => removeGalleryImage(idx)} className="self-end text-white hover:text-red-400 bg-black/50 rounded-full p-1 leading-none">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                        <input
                                            type="text"
                                            value={img.alt}
                                            onChange={(e) => handleGalleryAltChange(idx, e.target.value)}
                                            placeholder="Image Alt Text"
                                            className="w-full bg-white/90 text-xs px-2 py-1 rounded focus:outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="bg-primary text-white font-bold uppercase tracking-widest text-xs py-3 px-6 rounded-lg hover:bg-ink transition-colors">Save Profile</button>
                </form>
            </section>

            {/* Landing Page Settings */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-primary/10">
                <h2 className="text-2xl font-display text-ink mb-6 border-b border-primary/10 pb-4">Landing Page Configuration</h2>
                {siteMsg && <div className="mb-4 text-sm font-bold text-green-600 uppercase tracking-widest">{siteMsg}</div>}

                <form onSubmit={handleSiteSettingsUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Hero Title</label>
                            <input type="text" value={siteParams.heroTitle} onChange={e => setSiteParams({ ...siteParams, heroTitle: e.target.value })} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Hero Subtitle</label>
                            <input type="text" value={siteParams.heroSubtitle} onChange={e => setSiteParams({ ...siteParams, heroSubtitle: e.target.value })} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Hero Quote</label>
                        <textarea value={siteParams.heroQuote} onChange={e => setSiteParams({ ...siteParams, heroQuote: e.target.value })} rows={3} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary"></textarea>
                    </div>
                    <div className="pt-6 border-t border-primary/10">
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Daily Dose Quote</label>
                        <textarea value={siteParams.dailyDoseQuote} onChange={e => setSiteParams({ ...siteParams, dailyDoseQuote: e.target.value })} rows={2} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary mb-6"></textarea>

                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Sketchbook Notes Quote</label>
                        <textarea value={siteParams.sketchbookNotesQuote} onChange={e => setSiteParams({ ...siteParams, sketchbookNotesQuote: e.target.value })} rows={3} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary mb-4"></textarea>

                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Sketchbook Notes Author/Date</label>
                        <input type="text" value={siteParams.sketchbookNotesAuthor} onChange={e => setSiteParams({ ...siteParams, sketchbookNotesAuthor: e.target.value })} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary" />
                    </div>
                    <div className="pt-6 border-t border-primary/10">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Subscription Footer Title</label>
                            <input type="text" value={siteParams.footerTitle} onChange={e => setSiteParams({ ...siteParams, footerTitle: e.target.value })} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary mb-6" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Subscription Footer Quote</label>
                            <textarea value={siteParams.footerQuote} onChange={e => setSiteParams({ ...siteParams, footerQuote: e.target.value })} rows={3} className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary"></textarea>
                        </div>
                    </div>

                    <button type="submit" className="bg-primary text-white font-bold uppercase tracking-widest text-xs py-3 px-6 rounded-lg hover:bg-ink transition-colors mt-4">Save Landing Page Settings</button>
                </form>
            </section>
        </div>
    );
}
