import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import api from '../lib/api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
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
          <div className="flex items-center gap-4 text-ink/70">
            <button
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
              className="hover:text-primary transition-colors"
              title="Search articles"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <Link to="/archive" className="hover:text-primary transition-colors" title="Browse archive">
              <span className="material-symbols-outlined text-xl">local_library</span>
            </Link>
            <button
              className="lg:hidden text-ink hover:text-primary transition-colors"
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
    </>
  );
}
