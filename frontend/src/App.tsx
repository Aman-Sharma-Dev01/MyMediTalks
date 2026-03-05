import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ParticleEffect from './components/ParticleEffect';
import PageTransition from './components/PageTransition';
import ArchivePage from './pages/ArchivePage';
import ArticlePage from './pages/ArticlePage';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import PoetryPage from './pages/PoetryPage';
import SavedArticlesPage from './pages/SavedArticlesPage';
import LikedArticlesPage from './pages/LikedArticlesPage';

// Admin
import { AuthProvider } from './lib/AuthContext';
import { ReaderAuthProvider } from './lib/ReaderAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminEditor from './pages/admin/AdminEditor';
import AdminEngagement from './pages/admin/AdminEngagement';
import AdminArticleEngagement from './pages/admin/AdminArticleEngagement';
import AdminNotifications from './pages/admin/AdminNotifications';
import LoginPage from './pages/admin/LoginPage';
import RegisterPage from './pages/admin/RegisterPage';

// Separate component for public routes with AnimatePresence
function PublicLayout() {
  const location = useLocation();
  
  return (
    <>
      <ParticleEffect />
      <Navbar />
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/archive" element={<PageTransition><ArchivePage /></PageTransition>} />
            <Route path="/article/:id" element={<PageTransition><ArticlePage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/poetry" element={<PageTransition><PoetryPage /></PageTransition>} />
            <Route path="/saved" element={<PageTransition><SavedArticlesPage /></PageTransition>} />
            <Route path="/liked" element={<PageTransition><LikedArticlesPage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReaderAuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col paper-texture bg-cream">
            <Routes>
              {/* Admin Routes (No public Navbar/Footer) */}
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin/register" element={<RegisterPage />} />

              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="engagement" element={<AdminEngagement />} />
                <Route path="engagement/:id" element={<AdminArticleEngagement />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="editor" element={<AdminEditor />} />
                <Route path="editor/:id" element={<AdminEditor />} />
              </Route>

              {/* Public Routes */}
              <Route path="*" element={<PublicLayout />} />
            </Routes>
          </div>
        </Router>
      </ReaderAuthProvider>
    </AuthProvider>
  );
}
