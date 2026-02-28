import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', bio: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/register', formData);
            login(data.token, data);
            navigate('/admin/settings'); // Go to settings to upload photo right after
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cream px-6 py-12">
            <div className="max-w-xl w-full p-8 md:p-12 bg-white rounded-3xl shadow-xl border border-primary/10">
                <div className="text-center mb-10">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">edit_document</span>
                    <h1 className="text-4xl font-display italic text-ink mb-2">Author Setup</h1>
                    <p className="text-secondary font-hand">Initial Configuration for the Journal</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center font-sans tracking-wide">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Initial Bio (For About Page)</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary transition-colors resize-none"
                            placeholder="Write a brief introduction..."
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold uppercase tracking-widest text-sm py-4 rounded-lg hover:bg-ink transition-colors mt-8"
                    >
                        Create Author Account
                    </button>
                </form>
            </div>
        </div>
    );
}
