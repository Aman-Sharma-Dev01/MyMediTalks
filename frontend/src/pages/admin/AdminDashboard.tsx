import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, Globe, FileEdit, Trash2, Pencil } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDashboard() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const { data } = await api.get('/articles/admin/all');
            setArticles(data);
        } catch (error) {
            console.error('Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    };

    const getComputedStatus = (article: any) => {
        if (article.status === 'scheduled' && article.publishedAt && new Date(article.publishedAt) <= new Date()) {
            return 'published';
        }
        return article.status;
    };

    const filteredArticles = articles.filter((article: any) => {
        if (activeTab === 'all') return true;
        return getComputedStatus(article) === activeTab;
    });

    const deleteArticle = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this specific article?')) {
            try {
                await api.delete(`/articles/${id}`);
                fetchArticles();
            } catch (error) {
                console.error('Delete failed');
            }
        }
    };

    if (loading) return <div className="p-8 text-secondary italic">Loading entries...</div>;

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-display italic text-ink mb-2">Journal Entries</h1>
                    <p className="text-secondary font-hand">Manage your writings</p>
                </div>
                <Link
                    to="/admin/editor"
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-ink transition-colors"
                >
                    <Plus size={16} /> New Entry
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-primary/10 mb-8 px-2">
                {['all', 'published', 'draft', 'scheduled'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeTab === tab ? 'text-ink' : 'text-secondary hover:text-primary'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"></span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-cream/50 border-b border-primary/10">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary font-sans w-1/2">Title</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary font-sans">Status</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary font-sans">Date</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary font-sans text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArticles.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-secondary italic">
                                    No entries found in this category.
                                </td>
                            </tr>
                        ) : (
                            filteredArticles.map((article: any) => (
                                <tr key={article._id} className="border-b border-primary/5 hover:bg-cream/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-display text-lg text-ink font-medium">{article.title}</p>
                                        <p className="text-sm font-sans text-secondary truncate max-w-sm mt-1">{article.excerpt}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getComputedStatus(article) === 'published' ? 'bg-green-100 text-green-700' :
                                            getComputedStatus(article) === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {getComputedStatus(article) === 'published' && <Globe size={12} />}
                                            {getComputedStatus(article) === 'scheduled' && <Clock size={12} />}
                                            {getComputedStatus(article) === 'draft' && <FileEdit size={12} />}
                                            {getComputedStatus(article)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-sans text-secondary">
                                        {new Date(article.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Editor route needs ID to edit */}
                                            <Link to={`/admin/editor/${article._id}`} className="p-2 text-secondary hover:text-primary transition-colors bg-white rounded-lg border border-primary/10 shadow-sm">
                                                <Pencil size={16} />
                                            </Link>
                                            <button
                                                onClick={() => deleteArticle(article._id)}
                                                className="p-2 text-red-400 hover:text-red-600 transition-colors bg-white rounded-lg border border-red-100 shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
