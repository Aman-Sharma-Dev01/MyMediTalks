import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import api from '../lib/api';

export default function PoetryPage() {
  const [poetryArticles, setPoetryArticles] = useState<any[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await api.get('/articles');
        const poetry = data.filter((a: any) => a.category === 'Poetry');
        setPoetryArticles(poetry);
      } catch (error) {
        console.error('Failed to fetch articles');
      }
    };
    fetchArticles();
  }, []);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pt-20 pb-32 px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-24 space-y-6"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-12 bg-primary/30"></div>
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary font-sans">
            The Verse
          </span>
          <div className="h-px w-12 bg-primary/30"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-display italic text-ink tracking-tight leading-none">
          Medical Silence
        </h1>
        <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-light leading-relaxed italic">
          "The unspoken moments of clinical practice, captured in short-form reflections and verse."
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
        {poetryArticles.length === 0 ? (
          <div className="col-span-full text-center text-secondary italic font-display">No poetry published yet.</div>
        ) : (
          poetryArticles.map((poem, idx) => (
            <motion.article
              key={poem._id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="flex flex-col gap-8 group"
            >
              <div className="relative p-12 bg-white rounded-[2rem] shadow-sm border border-primary/5 hover:shadow-xl transition-shadow duration-300 group-hover:-translate-y-1">
                <div className="absolute -top-6 -left-6 w-24 h-24 opacity-10 pointer-events-none rotate-12 group-hover:rotate-6 transition-transform duration-300">
                  <span className="material-symbols-outlined text-8xl text-primary">spa</span>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-secondary/40 font-sans">
                    <span>{new Date(poem.createdAt).toLocaleDateString()}</span>
                    <span>{poem.readTime}</span>
                  </div>

                  <Link to={`/article/${poem.slug}`}>
                    <h2 className="text-3xl font-display italic text-ink group-hover:text-primary transition-colors leading-tight">
                      {poem.title}
                    </h2>
                  </Link>

                  <div className="h-px w-16 bg-primary/20"></div>

                  <p className="text-lg text-secondary/80 leading-relaxed italic font-light">
                    "{poem.excerpt}"
                  </p>

                  <div className="pt-6">
                    <Link
                      to={`/article/${poem.slug}`}
                      className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink group-hover:text-primary transition-colors font-sans"
                    >
                      Read the Verse
                      <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-2">arrow_right_alt</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>

      {/* Quote Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-40 text-center max-w-3xl mx-auto space-y-10"
      >
        <span className="material-symbols-outlined text-5xl text-primary/30">format_quote</span>
        <h2 className="text-2xl md:text-3xl font-display italic font-light leading-relaxed text-secondary">
          "Poetry is the language of the heart, and in medicine, we often find ourselves searching for words that do not yet exist."
        </h2>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-primary/20"></div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-secondary/40 font-sans">Elena Vance</span>
          <div className="h-px w-8 bg-primary/20"></div>
        </div>
      </motion.section>
    </div>
  );
}
