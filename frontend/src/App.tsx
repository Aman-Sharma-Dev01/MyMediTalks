import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ArchivePage from './pages/ArchivePage';
import ArticlePage from './pages/ArticlePage';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import PoetryPage from './pages/PoetryPage';

// Admin
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminEditor from './pages/admin/AdminEditor';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col paper-texture bg-cream">
          <Routes>
            {/* Admin Routes (No public Navbar/Footer) */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/register" element={<RegisterPage />} />

            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="editor" element={<AdminEditor />} />
              <Route path="editor/:id" element={<AdminEditor />} />
            </Route>

            {/* Public Routes */}
            <Route path="*" element={
              <>
                <Navbar />
                <div className="flex-grow">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/article/:id" element={<ArticlePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/poetry" element={<PoetryPage />} />
                  </Routes>
                </div>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
