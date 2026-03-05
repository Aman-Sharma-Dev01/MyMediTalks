import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bookmark, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useReaderAuth, getReaderToken } from '../lib/ReaderAuthContext';

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  readTime: string;
  createdAt: string;
}

export default function SavedArticlesPage() {
  const { isAuthenticated, isLoading: authLoading } = useReaderAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const token = getReaderToken();
        const { data } = await api.get('/interactions/saved', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setArticles(data);
      } catch (err) {
        console.error('Failed to load saved articles');
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchSaved();
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary font-display text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Bookmark size={64} className="text-primary/30 mb-6" />
        <h1 className="text-2xl font-display font-medium text-ink mb-2">Sign in to view saved articles</h1>
        <p className="text-secondary mb-8">Your saved articles will appear here</p>
        <Link to="/" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 md:py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <Bookmark className="text-primary" size={32} />
            <h1 className="text-4xl font-display font-medium text-ink">Saved Articles</h1>
          </div>
          <p className="text-secondary">Articles you've saved for later reading</p>
        </motion.div>

        {articles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bookmark size={64} className="mx-auto text-primary/20 mb-6" />
            <h2 className="text-xl font-display text-ink mb-2">No saved articles yet</h2>
            <p className="text-secondary mb-8">Start exploring and save articles you want to read later</p>
            <Link 
              to="/archive" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            >
              Browse Articles
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {articles.map((article, index) => (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={`/article/${article.slug}`}
                  className="block bg-white rounded-2xl border border-primary/10 overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col sm:flex-row">
                    {article.coverImage && (
                      <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
                        <img 
                          src={article.coverImage} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
                        {article.category}
                      </span>
                      <h2 className="text-xl font-display font-medium text-ink group-hover:text-primary transition-colors mb-2">
                        {article.title}
                      </h2>
                      <p className="text-secondary text-sm line-clamp-2 mb-4">{article.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-secondary">
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
