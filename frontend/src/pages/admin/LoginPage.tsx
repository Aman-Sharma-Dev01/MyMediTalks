import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.token, data);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cream px-6">
            <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-primary/10">
                <div className="text-center mb-8">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">local_florist</span>
                    <h1 className="text-4xl font-display italic text-ink mb-2">Journal Login</h1>
                    <p className="text-secondary font-hand">Admin Access Only</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center font-sans tracking-wide">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-cream border border-primary/20 rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold uppercase tracking-widest text-sm py-4 rounded-lg hover:bg-ink transition-colors mt-4"
                    >
                        Enter Journal
                    </button>
                </form>
            </div>
        </div>
    );
}
