import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Image as ImageIcon, Link as LinkIcon, Bold, Italic, Quote, Leaf, Heading1, Heading2, Heading3, Tag,
    Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Highlighter, Code, CodeXml, List, ListOrdered, Minus, Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon, Undo2, Redo2, Table as TableIcon, RemoveFormatting, ChevronDown,
    Palette, Type, PaintBucket, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown, Hash
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import UnderlineMark from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import SubScript from '@tiptap/extension-subscript';
import SuperScript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Typography from '@tiptap/extension-typography';
import api from '../../lib/api';

// ─── Toolbar Button ────────────────────────────────────────────────
interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault(); // Prevent editor blur — this is the key fix for bold/italic at cursor
            }}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-md transition-all duration-150 ${active
                ? 'text-primary bg-primary/10 shadow-sm'
                : 'text-ink/70 hover:text-primary hover:bg-primary/5'
                } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {children}
        </button>
    );
}

// ─── Toolbar Divider ───────────────────────────────────────────────
function ToolbarDivider() {
    return <div className="w-px h-6 bg-primary/10 mx-0.5 shrink-0" />;
}

// ─── Dropdown Menu ─────────────────────────────────────────────────
interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    title: string;
}

function ToolbarDropdown({ trigger, children, title }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen(!open)}
                title={title}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-all duration-150 text-ink/70 hover:text-primary hover:bg-primary/5 cursor-pointer ${open ? 'text-primary bg-primary/10' : ''}`}
            >
                {trigger}
                <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1.5 bg-white border border-primary/10 rounded-xl shadow-xl p-2 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                    {React.Children.map(children, (child) =>
                        React.isValidElement(child)
                            ? React.cloneElement(child as React.ReactElement<any>, {
                                onClick: (...args: any[]) => {
                                    (child as React.ReactElement<any>).props.onClick?.(...args);
                                    setOpen(false);
                                },
                            })
                            : child
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Color Picker Popup ────────────────────────────────────────────
const TEXT_COLORS = [
    { name: 'Default', color: '' },
    { name: 'Red', color: '#DC2626' },
    { name: 'Orange', color: '#EA580C' },
    { name: 'Amber', color: '#D97706' },
    { name: 'Green', color: '#16A34A' },
    { name: 'Teal', color: '#0D9488' },
    { name: 'Blue', color: '#2563EB' },
    { name: 'Indigo', color: '#4F46E5' },
    { name: 'Purple', color: '#9333EA' },
    { name: 'Pink', color: '#DB2777' },
    { name: 'Brown', color: '#92400E' },
    { name: 'Gray', color: '#6B7280' },
];

const HIGHLIGHT_COLORS = [
    { name: 'None', color: '' },
    { name: 'Yellow', color: '#FEF08A' },
    { name: 'Green', color: '#BBF7D0' },
    { name: 'Blue', color: '#BFDBFE' },
    { name: 'Purple', color: '#E9D5FF' },
    { name: 'Pink', color: '#FBCFE8' },
    { name: 'Orange', color: '#FED7AA' },
    { name: 'Red', color: '#FECACA' },
    { name: 'Teal', color: '#CCFBF1' },
];

// ─── Main Component ────────────────────────────────────────────────
export default function AdminEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Restore unsaved draft from localStorage if creating a new article
    const [formData, setFormData] = useState(() => {
        if (!id) {
            const saved = localStorage.getItem('mymeditalks_unsaved_draft');
            if (saved) {
                try { return JSON.parse(saved); } catch { /* ignore */ }
            }
        }
        return {
            title: '',
            excerpt: '',
            content: '',
            category: 'Journal',
            tags: [],
            readTime: '5 min',
            status: 'draft',
            coverImage: '',
            publishedAt: ''
        };
    });

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
    const [linkPrompt, setLinkPrompt] = useState<{ isOpen: boolean; url: string; text: string; action: 'insert' | 'update' | null }>({ isOpen: false, url: '', text: '', action: null });
    const [schedulePrompt, setSchedulePrompt] = useState({ isOpen: false, date: '' });
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
    const [showTableColorPicker, setShowTableColorPicker] = useState(false);
    // Lightweight counter — triggers toolbar re-render WITHOUT cloning formData
    const [, setToolbarTick] = useState(0);
    const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const inlineImageInputRef = useRef<HTMLInputElement>(null);
    const autosaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const textColorRef = useRef<HTMLDivElement>(null);
    const highlightColorRef = useRef<HTMLDivElement>(null);
    const tableColorRef = useRef<HTMLDivElement>(null);
    // Ref always holds latest formData — avoids stale closures in event handlers
    const formDataRef = useRef(formData);
    formDataRef.current = formData;

    // Close color pickers on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (textColorRef.current && !textColorRef.current.contains(e.target as Node)) setShowTextColorPicker(false);
            if (highlightColorRef.current && !highlightColorRef.current.contains(e.target as Node)) setShowHighlightColorPicker(false);
            if (tableColorRef.current && !tableColorRef.current.contains(e.target as Node)) setShowTableColorPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            ImageResize,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline hover:text-ink cursor-pointer transition-colors',
                    target: '_blank',
                    rel: 'noopener noreferrer'
                },
            }),
            UnderlineMark,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
            TextStyle,
            Color,
            SubScript,
            SuperScript,
            Table.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        tableLayout: {
                            default: 'full',
                            parseHTML: element => element.getAttribute('data-table-layout') || 'full',
                            renderHTML: attributes => {
                                if (attributes.tableLayout === 'full') return {};
                                return { 'data-table-layout': attributes.tableLayout };
                            },
                        },
                    };
                },
            }).configure({
                resizable: true,
            }),
            TableRow,
            TableCell.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        backgroundColor: {
                            default: null,
                            parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
                            renderHTML: (attributes: Record<string, any>) => {
                                if (!attributes.backgroundColor) return {};
                                return { style: `background-color: ${attributes.backgroundColor}` };
                            },
                        },
                    };
                },
            }),
            TableHeader.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        backgroundColor: {
                            default: null,
                            parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
                            renderHTML: (attributes: Record<string, any>) => {
                                if (!attributes.backgroundColor) return {};
                                return { style: `background-color: ${attributes.backgroundColor}` };
                            },
                        },
                    };
                },
            }),
            Typography,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-base md:prose-lg prose-slate font-display leading-[1.8] text-ink/90 focus:outline-none min-h-[300px] max-w-none prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-12 prose-h2:text-3xl prose-h2:font-medium prose-h2:mb-4 prose-h2:mt-10 prose-h3:text-2xl prose-h3:font-medium prose-h3:mb-3 prose-h3:mt-8 prose-img:rounded-xl prose-img:border prose-img:border-primary/10 prose-a:text-primary prose-a:underline hover:prose-a:text-ink prose-table:border-collapse prose-td:border prose-td:border-primary/10 prose-td:p-2 prose-th:border prose-th:border-primary/10 prose-th:p-2 prose-th:bg-cream/50 prose-th:font-bold',
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
            // Lightweight tick — only bumps a counter, does NOT clone formData
            setToolbarTick(t => t + 1);
        },
        onTransaction: () => {
            // Also tick on transactions (format apply, undo/redo) for instant toolbar feedback
            setToolbarTick(t => t + 1);
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

    // ─── Save to localStorage on tab/browser close for new unsaved articles ───
    useEffect(() => {
        const saveBeforeUnload = () => {
            const fd = formDataRef.current;
            const hasContent = fd.title.trim() || fd.excerpt.trim() || (fd.content.trim() && fd.content !== '<p></p>');
            if (!id && hasContent) {
                // New article not yet saved to server — persist to localStorage
                localStorage.setItem('mymeditalks_unsaved_draft', JSON.stringify(fd));
            } else if (id && hasContent) {
                // Existing article — fire-and-forget API save via sendBeacon
                const payload = JSON.stringify({ ...fd });
                const token = document.cookie.split('; ').find(c => c.startsWith('adminToken='))?.split('=')[1];
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon?.(`http://localhost:5000/api/articles/${id}?token=${token}`, blob);
            }
        };
        window.addEventListener('beforeunload', saveBeforeUnload);
        return () => window.removeEventListener('beforeunload', saveBeforeUnload);
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
            payload.publishedAt = null;
        }

        try {
            if (id) {
                await api.put(`/articles/${id}`, payload);
            } else {
                const { data } = await api.post('/articles', payload);
                // Clear localStorage draft after successful first save
                localStorage.removeItem('mymeditalks_unsaved_draft');
                if (!preventNavigate) navigate('/admin');
                else navigate(`/admin/editor/${data._id}`, { replace: true });
            }
            // Clear localStorage draft on any successful save
            localStorage.removeItem('mymeditalks_unsaved_draft');
            if (!preventNavigate) navigate('/admin');
        } catch (error: any) {
            console.error('Failed to save article', error);
            setErrorMsg(error.response?.data?.message || 'Failed to save article. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAutoSave = async (currentHtml: string) => {
        const fd = formDataRef.current;
        const payload = { ...fd, content: currentHtml };
        setAutosaveStatus('saving');

        try {
            if (id) {
                await api.put(`/articles/${id}`, payload);
            } else {
                // For new articles, save to localStorage
                localStorage.setItem('mymeditalks_unsaved_draft', JSON.stringify(payload));
            }
            setAutosaveStatus('saved');
            // Reset status after 3 seconds
            setTimeout(() => setAutosaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Autosave failed', error);
            setAutosaveStatus('idle');
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

    // ─── Format handler ────────────────────────────────────────────
    const handleFormat = useCallback((type: string) => {
        if (!editor) return;

        switch (type) {
            case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
            case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
            case 'underline':
                editor.chain().focus().toggleUnderline().run();
                break;
            case 'strike':
                editor.chain().focus().toggleStrike().run();
                break;
            case 'code':
                editor.chain().focus().toggleCode().run();
                break;
            case 'codeBlock':
                editor.chain().focus().toggleCodeBlock().run();
                break;
            case 'link':
                const previousUrl = editor.getAttributes('link').href;
                const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');

                if (!editor.state.selection.empty) {
                    setLinkPrompt({ isOpen: true, url: previousUrl || '', text: selectedText, action: 'update' });
                } else {
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
            case 'h3':
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                break;
            case 'bulletList':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'orderedList':
                editor.chain().focus().toggleOrderedList().run();
                break;
            case 'hr':
                editor.chain().focus().setHorizontalRule().run();
                break;
            case 'subscript':
                editor.chain().focus().toggleSubscript().run();
                break;
            case 'superscript':
                editor.chain().focus().toggleSuperscript().run();
                break;
            case 'alignLeft':
                if (editor.isActive('table')) {
                    editor.chain().focus().updateAttributes('table', { tableLayout: 'left' }).setTextAlign('left').run();
                } else {
                    editor.chain().focus().setTextAlign('left').run();
                }
                break;
            case 'alignCenter':
                if (editor.isActive('table')) {
                    editor.chain().focus().updateAttributes('table', { tableLayout: 'center' }).setTextAlign('center').run();
                } else {
                    editor.chain().focus().setTextAlign('center').run();
                }
                break;
            case 'alignRight':
                editor.chain().focus().setTextAlign('right').run();
                break;
            case 'alignJustify':
                if (editor.isActive('table')) {
                    editor.chain().focus().updateAttributes('table', { tableLayout: 'full' }).setTextAlign('justify').run();
                } else {
                    editor.chain().focus().setTextAlign('justify').run();
                }
                break;
            case 'undo':
                editor.chain().focus().undo().run();
                break;
            case 'redo':
                editor.chain().focus().redo().run();
                break;
            case 'clearFormat':
                editor.chain().focus().clearNodes().unsetAllMarks().run();
                break;
            case 'insertTable':
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                break;
        }
    }, [editor]);

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
        } else if (linkPrompt.action === 'insert') {
            const textToInsert = linkPrompt.text || finalUrl;
            editor.chain().focus().insertContent(`<a href="${finalUrl}">${textToInsert}</a>`).run();
        }

        setLinkPrompt({ isOpen: false, url: '', text: '', action: null });
    };

    const setTextColor = (color: string) => {
        if (!editor) return;
        if (color === '') {
            editor.chain().focus().unsetColor().run();
        } else {
            editor.chain().focus().setColor(color).run();
        }
        setShowTextColorPicker(false);
    };

    const setHighlightColor = (color: string) => {
        if (!editor) return;
        if (color === '') {
            editor.chain().focus().unsetHighlight().run();
        } else {
            editor.chain().focus().setHighlight({ color }).run();
        }
        setShowHighlightColorPicker(false);
    };

    const TABLE_CELL_COLORS = [
        { name: 'None', color: '' },
        { name: 'Beige 50', color: '#fcfaf6' },
        { name: 'Beige 100', color: '#f3f0e8' },
        { name: 'Beige 200', color: '#e8e2d2' },
        { name: 'Gray 50', color: '#f9fafb' },
        { name: 'Gray 100', color: '#f3f4f6' },
        { name: 'Gray 200', color: '#e5e7eb' },
        { name: 'Red 50', color: '#fef2f2' },
        { name: 'Red 100', color: '#fee2e2' },
        { name: 'Red 200', color: '#fecaca' },
        { name: 'Orange 50', color: '#fff7ed' },
        { name: 'Orange 100', color: '#ffedd5' },
        { name: 'Orange 200', color: '#fed7aa' },
        { name: 'Yellow 50', color: '#fefce8' },
        { name: 'Yellow 100', color: '#fef9c3' },
        { name: 'Yellow 200', color: '#fef08a' },
        { name: 'Green 50', color: '#f0fdf4' },
        { name: 'Green 100', color: '#dcfce7' },
        { name: 'Green 200', color: '#bbf7d0' },
        { name: 'Teal 50', color: '#f0fdfa' },
        { name: 'Teal 100', color: '#ccfbf1' },
        { name: 'Teal 200', color: '#99f6e4' },
        { name: 'Blue 50', color: '#eff6ff' },
        { name: 'Blue 100', color: '#dbeafe' },
        { name: 'Blue 200', color: '#bfdbfe' },
        { name: 'Purple 50', color: '#faf5ff' },
        { name: 'Purple 100', color: '#f3e8ff' },
        { name: 'Purple 200', color: '#e9d5ff' },
        { name: 'Pink 50', color: '#fdf2f8' },
        { name: 'Pink 100', color: '#fce7f3' },
        { name: 'Pink 200', color: '#fbcfe8' },
    ];

    const setCellBgColor = (color: string) => {
        if (!editor) return;
        editor.chain().focus().setCellAttribute('backgroundColor', color || null).run();
        setShowTableColorPicker(false);
    };

    const insertParagraphBeforeTable = () => {
        if (!editor || !editor.isActive('table')) return;
        const { $anchor } = editor.state.selection;
        let pos = undefined;
        for (let i = $anchor.depth; i > 0; i--) {
            if ($anchor.node(i).type.name === 'table') {
                pos = $anchor.before(i);
                break;
            }
        }
        if (pos !== undefined) {
            editor.chain().focus().insertContentAt(pos, '<p></p>').run();
        }
    };

    const insertParagraphAfterTable = () => {
        if (!editor || !editor.isActive('table')) return;
        const { $anchor } = editor.state.selection;
        let pos = undefined;
        for (let i = $anchor.depth; i > 0; i--) {
            if ($anchor.node(i).type.name === 'table') {
                pos = $anchor.after(i);
                break;
            }
        }
        if (pos !== undefined) {
            editor.chain().focus().insertContentAt(pos, '<p></p>').run();
        }
    };

    // ─── MS Word-style move handle + layout sync ──────────────────
    useEffect(() => {
        if (!editor) return;

        const syncTables = () => {
            const editorDom = editor.view.dom;
            const wrappers = editorDom.querySelectorAll('.tableWrapper');

            // 1. Inject move handles into table wrappers
            wrappers.forEach((wrapper) => {
                if (!wrapper.querySelector('.table-move-handle')) {
                    const handle = document.createElement('div');
                    handle.className = 'table-move-handle';
                    handle.textContent = '⊞';
                    handle.contentEditable = 'false';

                    handle.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const tableEl = wrapper.querySelector('table');
                        if (!tableEl) return;
                        const pos = editor.view.posAtDOM(tableEl, 0);
                        const resolved = editor.state.doc.resolve(pos);
                        for (let d = resolved.depth; d > 0; d--) {
                            if (resolved.node(d).type.name === 'table') {
                                editor.commands.setNodeSelection(resolved.before(d));
                                wrapper.querySelectorAll('.table-move-handle').forEach(h => h.classList.add('selected'));
                                break;
                            }
                        }
                    });

                    wrapper.insertBefore(handle, wrapper.firstChild);
                }
            });

            // 2. Sync data-table-layout from ProseMirror document → actual DOM
            //    Only writes if layout actually changed to avoid fighting the column resizer
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'table') {
                    const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
                    if (!dom) return;
                    const wrapper = dom.classList.contains('tableWrapper') ? dom : dom.closest('.tableWrapper') as HTMLElement;
                    if (!wrapper) return;

                    const layout = node.attrs.tableLayout || 'full';
                    const currentLayout = wrapper.getAttribute('data-table-layout') || 'full';
                    if (currentLayout === layout) return; // Already in sync — skip DOM write

                    if (layout === 'full') {
                        wrapper.removeAttribute('data-table-layout');
                    } else if (layout === 'center') {
                        wrapper.setAttribute('data-table-layout', 'center');
                    } else if (layout === 'left') {
                        wrapper.setAttribute('data-table-layout', 'left');
                    }
                }
            });
        };

        editor.on('transaction', syncTables);
        setTimeout(syncTables, 100);

        return () => {
            editor.off('transaction', syncTables);
        };
    }, [editor]);

    // ─── Move table up or down ─────────────────────────────────────
    const moveTable = useCallback((direction: 'up' | 'down') => {
        if (!editor) return;
        const { state } = editor;
        const { $anchor } = state.selection;

        // Find the table node and its depth
        let tableDepth = -1;
        for (let i = $anchor.depth; i > 0; i--) {
            if ($anchor.node(i).type.name === 'table') {
                tableDepth = i;
                break;
            }
        }
        if (tableDepth === -1) return;

        const tablePos = $anchor.before(tableDepth);
        const tableNode = state.doc.nodeAt(tablePos);
        if (!tableNode) return;

        const $tablePos = state.doc.resolve(tablePos);
        const parentNode = $tablePos.parent;
        const tableIndex = $tablePos.index();

        if (direction === 'up' && tableIndex === 0) return;
        if (direction === 'down' && tableIndex >= parentNode.childCount - 1) return;

        const { tr } = state;

        if (direction === 'up') {
            const prevSibling = parentNode.child(tableIndex - 1);
            const prevPos = tablePos - prevSibling.nodeSize;
            // Replace [prevNode, table] with [table, prevNode]
            tr.delete(prevPos, tablePos + tableNode.nodeSize);
            tr.insert(prevPos, tableNode);
            tr.insert(prevPos + tableNode.nodeSize, prevSibling);
        } else {
            const nextSibling = parentNode.child(tableIndex + 1);
            const afterTableEnd = tablePos + tableNode.nodeSize;
            // Replace [table, nextNode] with [nextNode, table]
            tr.delete(tablePos, afterTableEnd + nextSibling.nodeSize);
            tr.insert(tablePos, nextSibling);
            tr.insert(tablePos + nextSibling.nodeSize, tableNode);
        }

        editor.view.dispatch(tr.scrollIntoView());
    }, [editor]);

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

                        {/* ── Tags / SEO ───────────────────────────── */}
                        <div className="flex flex-col gap-3 mb-8 bg-cream/20 p-4 rounded-xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Hash size={14} className="text-primary/60" />
                                <span className="text-xs font-bold uppercase tracking-widest text-secondary/70">SEO Tags & Keywords</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags?.map((tag, index) => (
                                    <span key={index} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                        {tag}
                                        <button 
                                            onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) })} 
                                            className="hover:text-red-500 transition-colors opacity-60 hover:opacity-100"
                                            title="Remove tag"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder={formData.tags?.length ? "Add another tag and press Enter..." : "Type a keyword and press Enter..."}
                                className="bg-white border border-primary/10 rounded-lg px-4 py-2 text-sm font-sans text-ink focus:outline-none focus:border-primary/40 w-full max-w-lg transition-colors placeholder:text-secondary/40"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const newTag = e.currentTarget.value.trim();
                                        if (newTag && !(formData.tags || []).includes(newTag)) {
                                            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                            <p className="text-[10px] text-secondary/50 uppercase tracking-wider font-bold">These tags will be indexed by Google and improve search console visibility.</p>
                        </div>

                        {/* ═══════════════════════ FORMATTING TOOLBAR ═══════════════════════ */}
                        <div className="border border-primary/10 rounded-xl bg-cream/30 px-3 py-2 mb-8 sticky top-[73px] z-[5]">
                            <div className="flex items-center gap-1 flex-wrap">

                                {/* ── Undo / Redo ────────────────── */}
                                <ToolbarButton onClick={() => handleFormat('undo')} disabled={!editor?.can().undo()} title="Undo (Ctrl+Z)">
                                    <Undo2 size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('redo')} disabled={!editor?.can().redo()} title="Redo (Ctrl+Y)">
                                    <Redo2 size={16} />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* ── Headings Dropdown ──────────── */}
                                <ToolbarDropdown
                                    title="Heading Level"
                                    trigger={
                                        <span className="text-xs font-bold tracking-wide">
                                            {editor?.isActive('heading', { level: 1 }) ? 'H1'
                                                : editor?.isActive('heading', { level: 2 }) ? 'H2'
                                                    : editor?.isActive('heading', { level: 3 }) ? 'H3'
                                                        : 'Normal'}
                                        </span>
                                    }
                                >
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => editor?.chain().focus().setParagraph().run()}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors ${!editor?.isActive('heading') ? 'bg-primary/10 text-primary' : 'hover:bg-cream'}`}
                                    >
                                        <span className="text-sm">Normal text</span>
                                    </button>
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleFormat('h1')}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-primary/10 text-primary' : 'hover:bg-cream'}`}
                                    >
                                        <span className="text-xl font-bold font-display">Heading 1</span>
                                    </button>
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleFormat('h2')}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-primary/10 text-primary' : 'hover:bg-cream'}`}
                                    >
                                        <span className="text-lg font-semibold font-display">Heading 2</span>
                                    </button>
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleFormat('h3')}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-primary/10 text-primary' : 'hover:bg-cream'}`}
                                    >
                                        <span className="text-base font-medium font-display">Heading 3</span>
                                    </button>
                                </ToolbarDropdown>

                                <ToolbarDivider />

                                {/* ── Inline Formatting ─────────── */}
                                <ToolbarButton onClick={() => handleFormat('bold')} active={editor?.isActive('bold')} title="Bold (Ctrl+B)">
                                    <Bold size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('italic')} active={editor?.isActive('italic')} title="Italic (Ctrl+I)">
                                    <Italic size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('underline')} active={editor?.isActive('underline')} title="Underline (Ctrl+U)">
                                    <UnderlineIcon size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('strike')} active={editor?.isActive('strike')} title="Strikethrough">
                                    <Strikethrough size={16} />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* ── Text Color ────────────────── */}
                                <div className="relative" ref={textColorRef}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { setShowTextColorPicker(!showTextColorPicker); setShowHighlightColorPicker(false); }}
                                        title="Text Color"
                                        className={`flex items-center gap-0.5 p-1.5 rounded-md transition-all duration-150 cursor-pointer ${showTextColorPicker ? 'text-primary bg-primary/10' : 'text-ink/70 hover:text-primary hover:bg-primary/5'}`}
                                    >
                                        <Type size={16} />
                                        <div className="w-4 h-1 rounded-full mt-0.5" style={{ backgroundColor: editor?.getAttributes('textStyle').color || '#3E2F26' }} />
                                    </button>
                                    {showTextColorPicker && (
                                        <div className="absolute top-full left-0 mt-1.5 bg-white border border-primary/10 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 w-[200px]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 mb-2">Text Color</p>
                                            <div className="grid grid-cols-6 gap-1.5">
                                                {TEXT_COLORS.map(c => (
                                                    <button
                                                        key={c.name}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => setTextColor(c.color)}
                                                        title={c.name}
                                                        className="w-6 h-6 rounded-full border border-primary/10 hover:scale-125 transition-transform cursor-pointer relative"
                                                        style={{ backgroundColor: c.color || '#3E2F26' }}
                                                    >
                                                        {c.color === '' && (
                                                            <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">A</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Highlight Color ────────────── */}
                                <div className="relative" ref={highlightColorRef}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { setShowHighlightColorPicker(!showHighlightColorPicker); setShowTextColorPicker(false); }}
                                        title="Highlight Color"
                                        className={`flex items-center gap-0.5 p-1.5 rounded-md transition-all duration-150 cursor-pointer ${showHighlightColorPicker ? 'text-primary bg-primary/10' : 'text-ink/70 hover:text-primary hover:bg-primary/5'}`}
                                    >
                                        <Highlighter size={16} />
                                    </button>
                                    {showHighlightColorPicker && (
                                        <div className="absolute top-full left-0 mt-1.5 bg-white border border-primary/10 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 w-[200px]">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 mb-2">Highlight</p>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {HIGHLIGHT_COLORS.map(c => (
                                                    <button
                                                        key={c.name}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => setHighlightColor(c.color)}
                                                        title={c.name}
                                                        className="w-7 h-7 rounded-lg border border-primary/10 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-[9px] font-bold text-ink/50"
                                                        style={{ backgroundColor: c.color || '#f5f5f5' }}
                                                    >
                                                        {c.color === '' ? '✕' : ''}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <ToolbarDivider />

                                {/* ── Subscript / Superscript ───── */}
                                <ToolbarButton onClick={() => handleFormat('subscript')} active={editor?.isActive('subscript')} title="Subscript">
                                    <SubscriptIcon size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('superscript')} active={editor?.isActive('superscript')} title="Superscript">
                                    <SuperscriptIcon size={16} />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* ── Alignment ─────────────────── */}
                                <ToolbarButton onClick={() => handleFormat('alignLeft')} active={editor?.isActive({ textAlign: 'left' })} title="Align Left">
                                    <AlignLeft size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('alignCenter')} active={editor?.isActive({ textAlign: 'center' })} title="Align Center">
                                    <AlignCenter size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('alignRight')} active={editor?.isActive({ textAlign: 'right' })} title="Align Right">
                                    <AlignRight size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('alignJustify')} active={editor?.isActive({ textAlign: 'justify' })} title="Justify">
                                    <AlignJustify size={16} />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* ── Lists ─────────────────────── */}
                                <ToolbarButton onClick={() => handleFormat('bulletList')} active={editor?.isActive('bulletList')} title="Bullet List">
                                    <List size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('orderedList')} active={editor?.isActive('orderedList')} title="Numbered List">
                                    <ListOrdered size={16} />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* ── Block Elements ────────────── */}
                                <ToolbarButton onClick={() => handleFormat('quote')} active={editor?.isActive('blockquote')} title="Blockquote">
                                    <Quote size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('code')} active={editor?.isActive('code')} title="Inline Code">
                                    <Code size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('codeBlock')} active={editor?.isActive('codeBlock')} title="Code Block">
                                    <CodeXml size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('hr')} title="Horizontal Rule">
                                    <Minus size={16} />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* ── Insert Elements ──────────── */}
                                <ToolbarButton onClick={() => handleFormat('link')} active={editor?.isActive('link')} title="Insert Link">
                                    <LinkIcon size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('image')} disabled={uploadingInlineImage} title="Insert Image">
                                    <ImageIcon size={16} />
                                </ToolbarButton>
                                <ToolbarButton onClick={() => handleFormat('insertTable')} title="Insert Table">
                                    <TableIcon size={16} />
                                </ToolbarButton>
                                {editor?.isActive('table') && (
                                    <div className="ml-2 pl-2 border-l border-primary/10 flex items-center">
                                        <ToolbarDropdown
                                            trigger={<div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><TableIcon size={14} /><span className="text-[11px] font-bold uppercase tracking-wider">Settings</span></div>}
                                            title="Table Settings"
                                        >
                                            <div className="flex flex-col gap-0.5 w-[180px] p-1">
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                                                    let pos = -1;
                                                    for (let i = editor.state.selection.$anchor.depth; i > 0; i--) {
                                                        if (editor.state.selection.$anchor.node(i).type.name === 'table') { pos = editor.state.selection.$anchor.before(i); break; }
                                                    }
                                                    if (pos !== -1) editor.chain().focus().setNodeSelection(pos).run();
                                                }} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm font-medium transition-colors">Select Entire Table</button>
                                                <div className="h-px bg-primary/10 my-1"></div>
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-secondary/40 px-3 pt-1.5 pb-1">Table Layout</span>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().updateAttributes('table', { tableLayout: 'left' }).run()} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><AlignLeft size={14} className="opacity-70"/> Align Left (75%)</button>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().updateAttributes('table', { tableLayout: 'center' }).run()} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><AlignCenter size={14} className="opacity-70"/> Center (75%)</button>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().updateAttributes('table', { tableLayout: 'full' }).run()} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><AlignJustify size={14} className="opacity-70"/> Full Width (100%)</button>
                                                <div className="h-px bg-primary/10 my-1"></div>
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-secondary/40 px-3 pt-1.5 pb-1">Move Table</span>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => moveTable('up')} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><ArrowUp size={14} className="opacity-70"/> Move Up</button>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => moveTable('down')} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><ArrowDown size={14} className="opacity-70"/> Move Down</button>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={insertParagraphBeforeTable} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><ArrowUpToLine size={14} className="opacity-70"/> Add Space Above</button>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={insertParagraphAfterTable} className="text-left px-3 py-2 hover:bg-primary/5 rounded-lg w-full text-sm flex items-center gap-2.5 transition-colors"><ArrowDownToLine size={14} className="opacity-70"/> Add Space Below</button>
                                                <div className="h-px bg-primary/10 my-1"></div>
                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} className="text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg w-full text-sm font-medium transition-colors">Delete Table</button>
                                            </div>
                                        </ToolbarDropdown>
                                    </div>
                                )}
                                <input type="file" ref={inlineImageInputRef} onChange={handleInlineImageUpload} accept="image/*" className="hidden" />

                                <ToolbarDivider />

                                {/* ── Clear Formatting ─────────── */}
                                <ToolbarButton onClick={() => handleFormat('clearFormat')} title="Clear Formatting">
                                    <RemoveFormatting size={16} />
                                </ToolbarButton>
                            </div>

                            {/* ── Status bar ──────────────────── */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/5">
                                <div className="text-[10px] font-sans text-secondary/50 tracking-wider flex items-center gap-3">
                                    {autosaveStatus === 'saving' && <span className="italic text-amber-500 animate-pulse">Saving...</span>}
                                    {autosaveStatus === 'saved' && <span className="italic text-green-600">✓ Saved</span>}
                                    {!id && formData.title && <span className="italic text-blue-500">Draft in browser</span>}
                                    <span>{wordCount} words</span>
                                </div>

                                {/* Table controls — show only when cursor is inside a table */}
                                {editor?.isActive('table') && (
                                    <div className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-widest text-secondary/60">
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                                            className="px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            + Col
                                        </button>
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => editor.chain().focus().addRowAfter().run()}
                                            className="px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            + Row
                                        </button>
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => editor.chain().focus().deleteColumn().run()}
                                            className="px-2 py-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            − Col
                                        </button>
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => editor.chain().focus().deleteRow().run()}
                                            className="px-2 py-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            − Row
                                        </button>
                                        <div className="w-px h-4 bg-primary/20 mx-1"></div>
                                        {/* ── Table Cell Color ────────── */}
                                        <div className="relative" ref={tableColorRef}>
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => setShowTableColorPicker(!showTableColorPicker)}
                                                className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${showTableColorPicker ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10 hover:text-primary'}`}
                                                title="Cell Color"
                                            >
                                                <PaintBucket size={12} /> Color
                                            </button>
                                            {showTableColorPicker && (
                                                <div className="absolute bottom-full right-0 mb-1.5 bg-white border border-primary/10 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 w-[270px]">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 mb-2">Cell Background</p>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {TABLE_CELL_COLORS.map(c => (
                                                            <button
                                                                key={c.name}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => setCellBgColor(c.color)}
                                                                title={c.name}
                                                                className="w-7 h-7 rounded-md border border-primary/10 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-[8px] font-bold text-ink/40"
                                                                style={{ backgroundColor: c.color || '#ffffff' }}
                                                            >
                                                                {c.color === '' ? '✕' : ''}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => editor.chain().focus().deleteTable().run()}
                                            className="px-2 py-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            Delete Table
                                        </button>
                                    </div>
                                )}
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
