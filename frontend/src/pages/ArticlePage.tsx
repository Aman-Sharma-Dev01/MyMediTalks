import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import api from '../lib/api';

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data } = await api.get(`/articles/${id}`);
        setArticle(data);
      } catch (err) {
        console.error('Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-display text-xl text-ink">Loading manuscript...</div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center font-display text-xl text-ink">Article not found.</div>;


  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed top-32 left-10 w-64 h-96 opacity-10 pointer-events-none hidden xl:block">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5jZ7Ppen3fTHXZJn1KKtuXSY-0YUplE57uWLRoy7iYEzokaFuQw1IjteK1-ydIQGErcW-5OKfw8qI80qJvgI5x9k4NeEux5mqws3xrIAnbdIeBLg3QR28GzQ33DwK_PuvO_z0y-iBYrJeL1njJa7lAv8AJUsjm-xKvCVbOPGtdut43Ps1ZC5QDv00zJrFB_x9koPOT26mSkcn39VAUxqezSD992K_iEh2t_YJ0y4nKQmYQ4a3kac4PNYFK5IvBUiKqs901yjA7G4t"
          alt="Botanical Fern"
          className="w-full h-full object-contain mix-blend-multiply grayscale contrast-125"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="fixed bottom-20 right-10 w-48 h-80 opacity-10 pointer-events-none hidden xl:block">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjxERBsjLlpB9PSsJYqsYbTm8UU1K81kF1gEVuDaGA9BxLtO2h0FmV80cbzQtY-epidSWkUaUj2vc4RQLVMjLBCgK6NZeKLM4F-1fFj5HZXHqk8fshY7XEy2I0YFG0moDc3qp133pD_rC4PhMnEqUyX824BiahJ2Nwqhi7jNV7yxTyv1VlojiC07cl5ng8GyzGpdGReSAMmnSWpIr8ZmRdIONtG6pXJpBR4wkbPldOJrflZTazaj6E4-flTmwfr6gXrDxvFLtonFQw"
          alt="Botanical Flower"
          className="w-full h-full object-contain mix-blend-multiply grayscale contrast-125"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-[800px] mx-auto text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {article.category}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-light leading-[1.1] text-ink tracking-tight mb-8">
            {article.title}
          </h1>
          <p className="text-lg md:text-xl text-secondary leading-relaxed font-light italic mb-12 max-w-2xl mx-auto">
            "{article.excerpt}"
          </p>

          <div className="flex items-center justify-center gap-10 border-y border-primary/10 py-8">
            <div className="flex items-center gap-4">
              <img
                src={article.author?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAtV2ZdjIf_N_SezP_EuFqLEii0VvQq1QaS4u2ZNj7TkjgjcizTe8fYuyMbzhVanycltF_2oZdq2lMSCXkZ8LQqjPrZSKP6Pdo9SerkUQxWTA1FJDHSDbZDqk9n8QLjqilr1j7W2e1X9N9bTaAlTiarXz9AT5RaGAImTyJ94JEaLlbrzBKJcybDIx6LsUY0BNu7nfuXKbo-yv-mcJmLKvZ2JecrFJ3IuvC-182fZE6-qtLQSpbsvb8J9c1Y2lo4cFT0S4FYVApLc9mL"}
                alt={article.author?.name || "Author"}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 p-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-ink uppercase tracking-wider font-sans">{article.author?.name || "Dr. Elena Vance"}</p>
                <p className="text-xs text-secondary italic">Editor-in-Chief</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-primary/10"></div>
            <div className="text-left text-[10px] font-bold uppercase tracking-[0.2em] text-secondary flex flex-col sm:flex-row sm:gap-8 font-sans">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-primary/60">calendar_today</span> {new Date(article.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-primary/60">schedule</span> {article.readTime}</span>
            </div>
          </div>
        </motion.div>

        <div className="max-w-[720px] mx-auto relative">
          <div className="absolute -left-24 top-0 h-full hidden lg:block">
            <div className="sticky top-40 flex flex-col gap-6 text-secondary/40">
              <button className="w-12 h-12 flex items-center justify-center rounded-full border border-primary/10 hover:bg-primary/10 hover:text-primary transition-all group">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110">share</span>
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-full border border-primary/10 hover:bg-primary/10 hover:text-primary transition-all group">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110">bookmark_border</span>
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-full border border-primary/10 hover:bg-primary/10 hover:text-primary transition-all group">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110">chat_bubble_outline</span>
              </button>
            </div>
          </div>

          <motion.article
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="prose prose-lg md:prose-xl prose-slate font-display leading-[1.8] text-ink/90 prose-p:font-light prose-a:text-primary prose-a:underline hover:prose-a:text-ink prose-blockquote:border-primary/30 prose-blockquote:italic prose-blockquote:text-ink/80 prose-img:rounded-2xl mx-auto md:mx-0 w-full"
          >
            <div dangerouslySetInnerHTML={{ __html: article.content }} />

            {article.coverImage && (
              <figure className="my-16 -mx-6 md:-mx-16 lg:-mx-24 bg-cream/50 border border-primary/10 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={article.coverImage}
                  alt="Article Cover"
                  className="w-full h-[500px] object-cover opacity-90 hover:opacity-100 transition-opacity duration-700 grayscale-[20%] hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
              </figure>
            )}

          </motion.article>

          <div className="flex flex-wrap gap-2 mt-12 mb-16 pt-8 border-t border-dashed border-primary/20">
            {article.tags && article.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-background-light border border-primary/10 rounded-md text-xs font-medium text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>

          <div className="bg-paper border border-primary/10 rounded-2xl p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left shadow-sm">
            <img
              src={article.author?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAtV2ZdjIf_N_SezP_EuFqLEii0VvQq1QaS4u2ZNj7TkjgjcizTe8fYuyMbzhVanycltF_2oZdq2lMSCXkZ8LQqjPrZSKP6Pdo9SerkUQxWTA1FJDHSDbZDqk9n8QLjqilr1j7W2e1X9N9bTaAlTiarXz9AT5RaGAImTyJ94JEaLlbrzBKJcybDIx6LsUY0BNu7nfuXKbo-yv-mcJmLKvZ2JecrFJ3IuvC-182fZE6-qtLQSpbsvb8J9c1Y2lo4cFT0S4FYVApLc9mL"}
              alt={article.author?.name || "Author"}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-background-light"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-2">
                <h3 className="text-lg font-bold text-ink">{article.author?.name || "Dr. Elena Vance"}</h3>
                <button className="mt-2 sm:mt-0 text-xs font-bold text-primary border border-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">Follow</button>
              </div>
              <p className="text-sm text-secondary mb-4 leading-relaxed whitespace-pre-wrap">
                {article.author?.bio || "Advocates for holistic environmental changes in modern healthcare systems."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main >
  );
}
