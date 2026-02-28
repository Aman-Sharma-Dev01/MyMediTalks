import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Image as ImageIcon, Link as LinkIcon, Bold, Italic, Quote, Leaf, Heading1, Heading2, Tag } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import api from '../../lib/api';

export default function AdminEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: 'Journal',
        readTime: '5 min',
        status: 'draft',
        coverImage: '',
        publishedAt: ''
    });

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
    const [linkPrompt, setLinkPrompt] = useState<{ isOpen: boolean; url: string; text: string; action: 'insert' | 'update' | null }>({ isOpen: false, url: '', text: '', action: null });
    const [schedulePrompt, setSchedulePrompt] = useState({ isOpen: false, date: '' });
    const inlineImageInputRef = React.useRef<HTMLInputElement>(null);
    const autosaveTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageResize,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline hover:text-ink cursor-pointer transition-colors',
                    target: '_blank',
                    rel: 'noopener noreferrer'
                },
            })
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-base md:prose-lg prose-slate font-display leading-[1.8] text-ink/90 focus:outline-none min-h-[300px] max-w-none prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-12 prose-h2:text-3xl prose-h2:font-medium prose-h2:mb-4 prose-h2:mt-10 prose-img:rounded-xl prose-img:border prose-img:border-primary/10 prose-a:text-primary prose-a:underline hover:prose-a:text-ink',
                style: 'padding-bottom: 50px;'
            }
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setFormData(prev => ({ ...prev, content: html }));

            // Trigger autosave after 2 seconds of inactivity
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
            autosaveTimerRef.current = setTimeout(() => {
                handleAutoSave(html);
            }, 2000);
        },
        onSelectionUpdate: () => {
            // Force re-render for active state checks
            setFormData(prev => ({ ...prev }));
        }
    });

    useEffect(() => {
        if (id) {
            fetchArticle();
        }
        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            const { data } = await api.get(`/articles/admin/${id}`);
            setFormData({
                title: data.title,
                excerpt: data.excerpt,
                content: data.content,
                category: data.category,
                readTime: data.readTime,
                status: data.status,
                coverImage: data.coverImage || '',
                publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString().slice(0, 16) : ''
            });
            if (editor) {
                editor.commands.setContent(data.content);
            }
        } catch (error) {
            console.error('Failed to fetch article', error);
        }
    };

    // Update editor content if editor is initialized after fetch
    useEffect(() => {
        if (editor && formData.content && editor.isEmpty) {
            editor.commands.setContent(formData.content);
        }
    }, [editor, formData.content]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (status: string, preventNavigate = false, overrides = {}) => {
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

        if (!formData.title.trim()) {
            setErrorMsg('A title is required to save an article.');
            return;
        }
        if (!formData.excerpt.trim()) {
            setErrorMsg('An excerpt is required to save an article.');
            return;
        }
        if (!formData.content.trim() || formData.content === '<p></p>') {
            setErrorMsg('Content is required to save an article.');
            return;
        }
        if (status === 'scheduled' && !(overrides as any).publishedAt && !formData.publishedAt) {
            setErrorMsg('A scheduled date and time is required.');
            return;
        }

        setErrorMsg('');
        setSaving(true);
        const payload: any = { ...formData, ...overrides, status };

        if (status === 'published') {
            payload.publishedAt = null; // Clear scheduled date if publishing immediately
        }

        try {
            if (id) {
                await api.put(`/articles/${id}`, payload);
            } else {
                const { data } = await api.post('/articles', payload);
                if (!preventNavigate) navigate('/admin');
                else navigate(`/admin/editor/${data._id}`, { replace: true });
            }
            if (!preventNavigate) navigate('/admin');
        } catch (error: any) {
            console.error('Failed to save article', error);
            setErrorMsg(error.response?.data?.message || 'Failed to save article. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAutoSave = async (currentHtml: string) => {
        const payload = { ...formData, content: currentHtml };

        try {
            if (id) {
                await api.put(`/articles/${id}`, payload);
            }
            // If it's a new article, don't auto-save until they manually save it once to get an ID.
        } catch (error) {
            console.error('Autosave failed', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);
        setUploadingImage(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await api.post('/upload', uploadData, config);
            setFormData({ ...formData, coverImage: data.url });
        } catch (error) {
            console.error('Image upload failed', error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const uploadData = new FormData();
        uploadData.append('image', file);
        setUploadingInlineImage(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await api.post('/upload', uploadData, config);
            (editor.chain().focus() as any).setImage({ src: data.url, alt: file.name }).run();
        } catch (error) {
            console.error('Inline image upload failed', error);
        } finally {
            setUploadingInlineImage(false);
            if (inlineImageInputRef.current) {
                inlineImageInputRef.current.value = '';
            }
        }
    };

    const handleFormat = (type: string) => {
        if (!editor) return;

        switch (type) {
            case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
            case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
            case 'link':
                const previousUrl = editor.getAttributes('link').href;
                const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');

                if (!editor.state.selection.empty) {
                    // Update existing/selection
                    setLinkPrompt({ isOpen: true, url: previousUrl || '', text: selectedText, action: 'update' });
                } else {
                    // Insert new link at cursor
                    setLinkPrompt({ isOpen: true, url: '', text: '', action: 'insert' });
                }
                break;
            case 'quote':
                editor.chain().focus().toggleBlockquote().run();
                break;
            case 'image':
                inlineImageInputRef.current?.click();
                break;
            case 'h1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
        }
    };

    const applyLink = () => {
        if (!editor || !linkPrompt.action) return;

        if (linkPrompt.url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            setLinkPrompt({ isOpen: false, url: '', text: '', action: null });
            return;
        }

        let finalUrl = linkPrompt.url.trim();
        if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl) && !/^\//.test(finalUrl)) {
            finalUrl = `https://${finalUrl}`;
        }

        if (linkPrompt.action === 'update') {
            editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
            // If text changed, we might have to replace the selection, but native tiptap link extension updates the href well.
            // If they modify the text here it's trickier to replace in-place safely without replacing the whole mark.
            // For simplicity, handle standard href updates when selected.
        } else if (linkPrompt.action === 'insert') {
            const textToInsert = linkPrompt.text || finalUrl;
            editor.chain().focus().insertContent(`<a href="${finalUrl}">${textToInsert}</a>`).run();
        }

        setLinkPrompt({ isOpen: false, url: '', text: '', action: null });
    };

    // Clean html tags for word count
    const plainText = formData.content.replace(/<[^>]+>/g, '');
    const wordCount = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center">
            {/* Top Navbar Editor */}
            <div className="w-full bg-white border-b border-primary/10 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 -ml-2 text-secondary hover:text-primary transition-colors rounded-full hover:bg-cream"
                        title="Back to Dashboard"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary font-sans mb-1">
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <h1 className="text-3xl font-display text-ink uppercase tracking-tighter">New Entry</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                        className="bg-cream text-secondary border border-primary/10 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Save Draft
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setSchedulePrompt({ isOpen: !schedulePrompt.isOpen, date: formData.publishedAt || '' })}
                            disabled={saving}
                            className={`border text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors disabled:opacity-50 ${schedulePrompt.isOpen ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                        >
                            Schedule
                        </button>
                        {schedulePrompt.isOpen && (
                            <div className="absolute top-full right-0 mt-2 p-4 bg-white border border-primary/20 rounded-xl shadow-lg flex flex-col gap-3 z-50 animate-in fade-in zoom-in-95 w-64">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70">Publish Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={schedulePrompt.date}
                                    onChange={(e) => setSchedulePrompt(prev => ({ ...prev, date: e.target.value }))}
                                    className="border border-primary/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40 bg-cream/30 w-full font-sans text-ink"
                                />
                                <div className="flex gap-2 w-full mt-1">
                                    <button
                                        onClick={() => {
                                            if (!schedulePrompt.date) {
                                                setErrorMsg('Please select a date and time.');
                                                return;
                                            }
                                            setFormData(prev => ({ ...prev, publishedAt: schedulePrompt.date }));
                                            setSchedulePrompt(prev => ({ ...prev, isOpen: false }));
                                            handleSave('scheduled', false, { publishedAt: schedulePrompt.date });
                                        }}
                                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => setSchedulePrompt(prev => ({ ...prev, isOpen: false }))}
                                        className="flex-1 bg-cream text-secondary px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors border border-primary/10"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={saving}
                        className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full hover:bg-ink transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Publish'}
                    </button>
                </div>
            </div>

            {/* Editor Content Box */}
            <div className="w-full max-w-4xl py-12 px-6">
                <div className="bg-white rounded-[2rem] shadow-sm border border-primary/10 overflow-hidden flex flex-col min-h-[700px]">

                    {/* Cover Image Placeholder */}
                    <div className="h-64 bg-cream/30 border-b border-primary/5 flex flex-col items-center justify-center relative group overflow-hidden">
                        {formData.coverImage ? (
                            <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
                        ) : null}

                        <div className="z-10 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl border border-primary/10 shadow-sm flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ImageIcon size={24} className="mb-2 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-ink mb-2">
                                {uploadingImage ? 'Uploading...' : formData.coverImage ? 'Change Cover Image' : 'Upload Cover Image'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="w-[200px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex-1 p-12 flex flex-col">
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                <span className="font-medium">{errorMsg}</span>
                                <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                        )}
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Title your thoughts..."
                            className="w-full text-5xl md:text-6xl font-display font-bold text-primary/30 focus:text-ink bg-transparent focus:outline-none placeholder-primary/20 mb-8 tracking-tight"
                        />

                        <input
                            type="text"
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            placeholder="Write a brief excerpt or subtitle..."
                            className="w-full text-xl font-display italic text-secondary/50 focus:text-secondary bg-transparent focus:outline-none placeholder-secondary/30 mb-6"
                        />

                        {/* Category Selector */}
                        <div className="flex items-center gap-3 mb-8">
                            <Tag size={14} className="text-primary/60" />
                            <select
                                name="category"
                                value={['Journal', 'Clinical Reflections', 'Poetry', 'Case Studies', 'History of Medicine', 'Opinion', 'Research', 'Wellness'].includes(formData.category) ? formData.category : '__custom__'}
                                onChange={(e) => {
                                    if (e.target.value === '__custom__') {
                                        setFormData({ ...formData, category: '' });
                                    } else {
                                        setFormData({ ...formData, category: e.target.value });
                                    }
                                }}
                                className="bg-cream/50 border border-primary/10 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink font-sans focus:outline-none focus:border-primary/40 cursor-pointer"
                            >
                                <option value="Journal">Journal</option>
                                <option value="Clinical Reflections">Clinical Reflections</option>
                                <option value="Poetry">Poetry</option>
                                <option value="Case Studies">Case Studies</option>
                                <option value="History of Medicine">History of Medicine</option>
                                <option value="Opinion">Opinion</option>
                                <option value="Research">Research</option>
                                <option value="Wellness">Wellness</option>
                                <option value="__custom__">Custom...</option>
                            </select>
                            {!['Journal', 'Clinical Reflections', 'Poetry', 'Case Studies', 'History of Medicine', 'Opinion', 'Research', 'Wellness'].includes(formData.category) && (
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Type custom category..."
                                    className="bg-cream/50 border border-primary/10 rounded-lg px-3 py-1.5 text-xs font-sans text-ink focus:outline-none focus:border-primary/40 min-w-[160px]"
                                    autoFocus
                                />
                            )}
                        </div>
                        {/* Formatting Toolbar */}
                        <div className="flex items-center justify-between border-b border-primary/10 pb-4 mb-8">
                            <div className="flex gap-4 text-ink flex-wrap">
                                <button type="button" onClick={() => handleFormat('bold')} className={`p-1 transition-colors ${editor?.isActive('bold') ? 'text-primary bg-primary/10 rounded' : 'hover:text-primary'}`}><Bold size={18} /></button>
                                <button type="button" onClick={() => handleFormat('italic')} className={`p-1 transition-colors ${editor?.isActive('italic') ? 'text-primary bg-primary/10 rounded' : 'hover:text-primary'}`}><Italic size={18} /></button>
                                <button type="button" onClick={() => handleFormat('h1')} className={`p-1 transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'text-primary bg-primary/10 rounded' : 'hover:text-primary'}`}><Heading1 size={18} /></button>
                                <button type="button" onClick={() => handleFormat('h2')} className={`p-1 transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'text-primary bg-primary/10 rounded' : 'hover:text-primary'}`}><Heading2 size={18} /></button>
                                <button type="button" onClick={() => handleFormat('link')} className={`p-1 transition-colors ${editor?.isActive('link') ? 'text-primary bg-primary/10 rounded' : 'hover:text-primary'}`}><LinkIcon size={18} /></button>
                                <div className="w-px h-6 bg-primary/10"></div>
                                <button type="button" onClick={() => handleFormat('quote')} className={`p-1 transition-colors ${editor?.isActive('blockquote') ? 'text-primary bg-primary/10 rounded' : 'hover:text-primary'}`}><Quote size={18} /></button>
                                <button type="button" onClick={() => handleFormat('image')} disabled={uploadingInlineImage} className="p-1 hover:text-primary transition-colors disabled:opacity-50">
                                    <ImageIcon size={18} />
                                </button>
                                <input type="file" ref={inlineImageInputRef} onChange={handleInlineImageUpload} accept="image/*" className="hidden" />
                            </div>
                            <div className="text-xs font-sans text-secondary tracking-widest flex items-center gap-4">
                                {autosaveTimerRef.current !== undefined && <span className="opacity-50 italic">Autosaved</span>}
                                <span>{wordCount} words</span>
                            </div>
                        </div>

                        {/* Custom Link UI Popover */}
                        {linkPrompt.isOpen && (
                            <div className="mb-6 p-4 bg-white border border-primary/20 rounded-xl shadow-lg flex gap-4 items-end animate-in fade-in zoom-in-95 self-start">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70">Link URL</label>
                                    <input
                                        type="url"
                                        value={linkPrompt.url}
                                        onChange={(e) => setLinkPrompt(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://..."
                                        className="border border-primary/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40 bg-cream/30 min-w-[200px]"
                                        autoFocus
                                    />
                                </div>
                                {linkPrompt.action === 'insert' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70">Text to display</label>
                                        <input
                                            type="text"
                                            value={linkPrompt.text}
                                            onChange={(e) => setLinkPrompt(prev => ({ ...prev, text: e.target.value }))}
                                            placeholder="Click here"
                                            className="border border-primary/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/40 bg-cream/30 min-w-[150px]"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={applyLink}
                                        className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-ink transition-colors"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={() => setLinkPrompt({ isOpen: false, url: '', text: '', action: null })}
                                        className="bg-cream text-secondary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <EditorContent editor={editor} className="flex-1 text-lg font-display text-ink/80 leading-relaxed bg-transparent focus:outline-none min-h-[300px]" />

                        <div className="flex justify-center mt-12 mb-4 opacity-20">
                            <Leaf size={32} className="text-primary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
