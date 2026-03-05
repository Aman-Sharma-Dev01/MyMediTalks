import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { Bell, LogOut, Bookmark, Heart, User } from 'lucide-react';
import api from '../lib/api';
import { useReaderAuth } from '../lib/ReaderAuthContext';
import LoginModal from './LoginModal';
import SubscribeModal from './SubscribeModal';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reader, isAuthenticated, logout } = useReaderAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'The Journal', path: '/' },
    { name: 'Reflections', path: '/archive' },
    { name: 'About', path: '/about' },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Search articles on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/articles');
        const query = searchQuery.toLowerCase();
        const filtered = data.filter((a: any) =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
        );
        setSearchResults(filtered.slice(0, 5));
      } catch (err) {
        console.error('Search failed');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="w-full bg-transparent px-6 py-8 lg:px-12 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Left */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 text-ink group">
              <span className="material-symbols-outlined text-primary text-2xl group-hover:rotate-12 transition-transform duration-300">local_florist</span>
              <span className="text-2xl font-display font-medium tracking-tight text-[#2c3e50]" style={{ color: '#1B2C4E' }}>
                MyMediTalks
              </span>
            </Link>
          </div>

          {/* Center Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={twMerge(
                  "text-lg font-hand transition-colors duration-300 hover:text-primary",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-ink/70"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Icons Right */}
          <div className="flex items-center gap-3 text-ink/70">
            {/* Subscribe Button - hide if user is authenticated and subscribed */}
            {!(isAuthenticated && reader?.isSubscribed) && (
              <button
                onClick={() => setSubscribeModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all text-sm font-medium group"
              >
                <Bell size={16} className="group-hover:animate-bounce" />
                <span>Subscribe</span>
              </button>
            )}

            <button
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
              className="hover:text-primary transition-colors p-2"
              title="Search articles"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={reader?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader?.name || 'U')}&background=d4a574&color=fff`}
                    alt={reader?.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-primary/10 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-primary/10">
                      <p className="font-medium text-ink truncate">{reader?.name}</p>
                      <p className="text-xs text-secondary truncate">{reader?.email}</p>
                      {reader?.isSubscribed && (
                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                          <Bell size={12} /> Subscribed
                        </p>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/saved'); }}
                        className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-primary/5 flex items-center gap-3"
                      >
                        <Bookmark size={16} className="text-primary" />
                        Saved Articles
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/liked'); }}
                        className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-primary/5 flex items-center gap-3"
                      >
                        <Heart size={16} className="text-primary" />
                        Liked Articles
                      </button>
                    </div>
                    <div className="border-t border-primary/10 pt-1">
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-primary/30 text-ink rounded-full hover:bg-primary/5 transition-all text-sm"
              >
                <User size={16} />
                <span>Sign In</span>
              </button>
            )}

            <button
              className="lg:hidden text-ink hover:text-primary transition-colors p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-primary/10 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={twMerge(
                    "text-lg font-hand px-4 py-3 rounded-xl transition-colors",
                    location.pathname === link.path
                      ? "text-primary bg-primary/5"
                      : "text-ink/70 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Mobile Subscribe & Auth */}
              <div className="mt-4 pt-4 border-t border-primary/10 flex flex-col gap-2">
                {!(isAuthenticated && reader?.isSubscribed) && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); setSubscribeModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-lg font-hand"
                  >
                    <Bell size={18} />
                    Subscribe
                  </button>
                )}
                {!isAuthenticated && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); setLoginModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-3 border border-primary/30 text-ink rounded-xl text-lg font-hand"
                  >
                    <User size={18} />
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center pt-[15vh] bg-cream/95 backdrop-blur-md animate-in fade-in duration-200">
          <button
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            className="absolute top-6 right-6 text-ink/60 hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          <div className="w-full max-w-2xl px-6">
            <div className="flex items-center gap-4 border-b-2 border-primary/20 pb-4 mb-8">
              <span className="material-symbols-outlined text-3xl text-primary/50">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, topics..."
                className="flex-1 bg-transparent text-3xl md:text-4xl font-display font-light text-ink placeholder-primary/20 focus:outline-none tracking-tight"
              />
            </div>

            {searchQuery.trim() && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary font-sans mb-4">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
                {searchResults.length === 0 ? (
                  <p className="text-secondary italic font-display text-lg">No articles match your search.</p>
                ) : (
                  searchResults.map((article: any) => (
                    <button
                      key={article._id}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        navigate(`/article/${article.slug}`);
                      }}
                      className="w-full text-left p-4 rounded-xl hover:bg-white/80 transition-colors group flex flex-col gap-1 border border-transparent hover:border-primary/10"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary font-sans">{article.category}</span>
                      <span className="text-xl font-display font-medium text-ink group-hover:text-primary transition-colors">{article.title}</span>
                      <span className="text-sm text-secondary font-light line-clamp-1">{article.excerpt}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {!searchQuery.trim() && (
              <p className="text-secondary/50 italic font-display text-lg text-center mt-8">Start typing to search...</p>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />

      {/* Subscribe Modal */}
      <SubscribeModal 
        isOpen={subscribeModalOpen} 
        onClose={() => setSubscribeModalOpen(false)} 
      />
    </>
  );
}
