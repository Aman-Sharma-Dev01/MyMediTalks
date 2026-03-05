import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye } from 'lucide-react';
import api from '../lib/api';

export default function ArchivePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeYear, setActiveYear] = useState('All');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await api.get('/articles');
        setArticles(data);
      } catch (error) {
        console.error('Failed to fetch articles');
      }
    };
    fetchArticles();
  }, []);

  // Extract unique categories and years from actual articles
  const categories = ['All', ...Array.from(new Set(articles.map((a: any) => a.category).filter(Boolean)))];
  const years = ['All', ...Array.from(new Set(articles.map((a: any) => new Date(a.createdAt).getFullYear().toString()))).sort((a, b) => Number(b) - Number(a))];

  const filteredArticles = articles.filter((article: any) => {
    const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
    const matchesYear = activeYear === 'All' || new Date(article.createdAt).getFullYear().toString() === activeYear;
    return matchesCategory && matchesYear;
  });

  return (
    <div className="flex flex-col md:flex-row w-full max-w-[1400px] mx-auto pt-12 pb-20 px-6 lg:px-12 gap-12">
      {/* Sidebar Left */}
      <aside className="hidden lg:block w-1/5 pt-20 sticky top-24 h-fit opacity-60">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-12 items-center"
        >
          <div className="w-full h-64 bg-secondary/10 rounded-full flex items-center justify-center overflow-hidden mix-blend-multiply">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2W6FpOTbOU2dVKs4pIX9U8F_DM7XXZgQJal5XTIcWffJJ-pjvxNpDol7TzbDNAilPw7FnvOjGzbZbqZQ0oe7hzfrJfUTViYDicxTkrRv3fSYAtqtpTuN1x5ypsH0AJ1CkPlTfujRd5PIkUL7zJvMdF6CFS3P_qRwBS00out3P4H5HXmS8mBunRUnLhBMv0NJmuomvBaO6v0J-koufBcdTxr2E4B5GAHtRyUexjhWnF-D7zByu1yMlKWJIpVEO6Skqu4fL9NrcswFw"
              alt="Botanical olive branch sketch"
              className="w-full h-full object-cover opacity-60 grayscale sepia-[.3]"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold font-sans">Featured Collection</p>
            <h3 className="text-xl font-medium italic">"The Healing Garden"</h3>
          </div>
        </motion.div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-secondary uppercase tracking-[0.4em] text-xs font-sans font-bold">Est. 2023</p>
          <h1 className="text-4xl md:text-6xl font-light text-ink mb-6 tracking-tight">The Archive</h1>
          <p className="text-base md:text-lg text-secondary max-w-lg mx-auto italic font-light leading-relaxed">
            A curated collection of thoughts, clinical reflections, and poetry exploring the intersection of medicine and the human experience.
          </p>
        </motion.div>

        {/* Dynamic Filter Navigation */}
        <div className="mb-16 border-y border-primary/10 py-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 font-sans text-xs font-bold uppercase tracking-widest">
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-1 transition-colors ${activeCategory === cat ? 'text-ink border-b-2 border-primary' : 'text-secondary hover:text-primary'}`}
              >
                {cat === 'All' ? 'All Writings' : cat}
              </button>
            ))}
            {years.length > 1 && <span className="text-primary/10">|</span>}
            {years.filter(y => y !== 'All').map((year: string) => (
              <button
                key={year}
                onClick={() => setActiveYear(activeYear === year ? 'All' : year)}
                className={`pb-1 transition-colors ${activeYear === year ? 'text-ink border-b-2 border-primary' : 'text-secondary hover:text-primary'}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Article List */}
        <div className="space-y-16">
          {filteredArticles.length === 0 ? (
            <p className="text-secondary italic font-display text-center">No articles found for this filter.</p>
          ) : (
            filteredArticles.map((article, idx) => (
              <motion.article
                key={article._id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="group relative flex flex-col gap-4 pb-16 border-b border-primary/5 last:border-0"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary font-sans">{article.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-secondary font-sans">
                      <Eye size={12} /> {(article.views || 0).toLocaleString()}
                    </span>
                    <time className="text-xs text-secondary font-sans uppercase tracking-widest">{new Date(article.createdAt).toLocaleDateString()}</time>
                  </div>
                </div>
                <Link to={`/article/${article.slug}`}>
                  <h2 className="text-2xl md:text-3xl font-medium text-ink group-hover:text-primary transition-colors cursor-pointer leading-tight">
                    {article.title}
                  </h2>
                </Link>
                <p className="text-base leading-relaxed text-secondary font-light">
                  {article.excerpt}
                </p>
                <Link to={`/article/${article.slug}`} className="inline-flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-[0.2em] text-ink group-hover:text-primary transition-colors font-sans w-fit">
                  Read Essay <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </motion.article>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center items-center gap-8 py-10">
          <button className="text-secondary cursor-not-allowed opacity-50 flex items-center gap-1 font-sans text-sm">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Previous
          </button>
          <div className="flex gap-4 font-sans text-sm">
            <span className="text-ink font-bold border-b border-primary">1</span>
            <button className="text-secondary hover:text-ink">2</button>
            <button className="text-secondary hover:text-ink">3</button>
            <span className="text-secondary">...</span>
            <button className="text-secondary hover:text-ink">8</button>
          </div>
          <button className="text-ink hover:text-primary flex items-center gap-1 font-sans text-sm transition-colors">
            Next <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Sidebar Right */}
      <aside className="hidden lg:block w-1/5 pt-40 sticky top-24 h-fit opacity-60">
        <div className="flex flex-col gap-8 items-center">
          <div className="w-full h-80 relative overflow-hidden rounded-xl">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrUPohaPUXDmIcVoI3jRTx2gppFrCcpYoFZjbsaWpyKw87kqREbFr8Vnvl3PMCQM3cweivn45kgy-Y6kOY2LHMVWCY0FHHau-apm9pbqGalqWF2ftyOQagtoUoyc-3V_s_hb0IHo3vWEyWqytP9topDwBbsNgoNN5mFX4JBmBegelK6C818AOp96eKKBwejnUA6lpcFQmIqPgGxlmX9epnJDCj7JOawee_z_tA3oFt2ToHcJ_I9s2jwjJ82OI5TisQO84lFdXRuFIR"
              alt="Medicinal herbs sketch"
              className="w-full h-full object-cover grayscale sepia-[.3]"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
