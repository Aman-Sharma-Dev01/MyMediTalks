import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center font-display italic text-2xl text-secondary">Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
}
