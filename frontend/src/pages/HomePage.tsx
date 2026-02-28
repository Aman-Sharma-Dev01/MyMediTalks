import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function HomePage() {
  const [settings, setSettings] = useState({
    heroTitle: 'MyMediTalks',
    heroSubtitle: 'Volume II: The Healing Arts',
    heroQuote: 'Exploring the intersections of biological science and human experience through the lens of a botanical illustrator.',
    footerTitle: 'A letter from the gardener...',
    footerQuote: 'Medicine is an art form practiced on the canvas of life. Join me in sketching out the wonders of our biology.',
    dailyDoseQuote: '"Remember to breathe as deeply as the roots reach."',
    sketchbookNotesQuote: '"The way a leaf veins mirror the bronchial tree of our lungs is not a coincidence, but a conversation in the language of growth."',
    sketchbookNotesAuthor: 'Dr. Aria Thorne, 2023'
  });

  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, articlesRes] = await Promise.all([
          api.get('/settings'),
          api.get('/articles')
        ]);
        if (settingsRes.data) setSettings(settingsRes.data);
        // Get the top 3 latest published/scheduled articles
        if (articlesRes.data) setArticles(articlesRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load homepage data');
      }
    };
    fetchData();
  }, []);

  // Safe fallback if not enough articles for masonry grid layout
  const latestArticle = articles[0] || null;
  const secondArticle = articles[1] || null;
  const thirdArticle = articles[2] || null;

  return (
    <div className="flex flex-col w-full min-h-screen items-center pb-32">

      {/* Background Decor */}
      <div className="fixed top-10 left-10 opacity-20 pointer-events-none z-0 mix-blend-multiply">
        <span className="material-symbols-outlined text-[150px] text-secondary">eco</span>
      </div>
      <div className="fixed top-20 right-20 opacity-15 pointer-events-none z-0 mix-blend-multiply rotate-12">
        <span className="material-symbols-outlined text-[100px] text-[#A8988D]">psychology_alt</span>
      </div>

      {/* Header Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mt-12 mb-20 relative z-10 w-full max-w-4xl px-4 flex flex-col items-center"
      >
        <h1 className="text-7xl md:text-9xl font-display italic text-[#814C35] mb-4 tracking-tighter" style={{ lineHeight: '1.1' }}>
          {settings.heroTitle}
        </h1>
        <p className="text-xl md:text-2xl font-hand text-secondary mb-8">
          {settings.heroSubtitle}
        </p>

        <div className="max-w-xl flex gap-4 text-center items-start">
          <span className="font-display text-4xl text-ink/20 mt-[-10px]">"</span>
          <p className="text-lg md:text-xl font-display italic font-light text-ink/70 leading-relaxed">
            {settings.heroQuote}
          </p>
          <span className="font-display text-4xl text-ink/20 mt-[-10px]">&quot;</span>
        </div>
      </motion.div>

      {/* Grid Container */}
      <div className="w-full max-w-6xl px-4 md:px-8 relative z-10 mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">

          {/* Left Column */}
          <div className="flex flex-col gap-8 w-full md:w-[60%] lg:w-[55%]">

            {/* Card 1: Latest Article */}
            {latestArticle ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="sketch-card p-1 pb-4 pr-1 relative w-full"
              >
                <div className="pin pin-top-center"></div>
                <div className="p-8 pb-12 flex flex-col md:flex-row gap-8 bg-paper">

                  {/* Image side */}
                  <div className="w-full md:w-1/2 relative z-10">
                    <div className="aspect-[4/5] bg-ink/5 p-2 shadow-sm relative">
                      <img
                        src={latestArticle.coverImage || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80"}
                        alt={latestArticle.title}
                        className="w-full h-full object-cover filter contrast-125 sepia-[.3]"
                      />
                    </div>
                    {/* Tape with text over image */}
                    <div className="absolute -bottom-6 -left-4 tape-bottom-left rotate-[-5deg] px-6 py-2 shadow-sm" style={{ backdropFilter: 'none', backgroundColor: '#FDFBF7' }}>
                      <span className="font-hand text-accent text-sm whitespace-nowrap">Observation Form</span>
                    </div>
                  </div>

                  {/* Text side */}
                  <div className="w-full md:w-1/2 flex flex-col justify-center relative">
                    <div className="absolute top-0 right-0 opacity-20">
                      <span className="material-symbols-outlined text-4xl text-secondary inline-block rotate-12">timeline</span>
                    </div>

                    <div className="space-y-4 relative z-10 mt-4 md:mt-0">
                      <p className="font-hand text-secondary text-base">{new Date(latestArticle.createdAt).toLocaleDateString()}</p>
                      <h2 className="text-3xl font-display font-medium text-[#A34A4A] leading-tight">{latestArticle.title}</h2>
                      <p className="font-display italic text-ink/80 leading-relaxed font-light text-base md:text-lg">
                        {latestArticle.excerpt}
                      </p>
                      <div className="pt-4">
                        <Link to={`/article/${latestArticle.slug}`} className="font-hand text-xl text-ink hover:text-accent transition-colors">Turn the page →</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="sketch-card p-1 pb-4 pr-1 relative w-full opacity-50 grayscale"
              >
                <div className="pin pin-top-center"></div>
                <div className="p-8 pb-12 flex flex-col md:flex-row gap-8 bg-paper">
                  <div className="w-full md:w-1/2 relative z-10">
                    <div className="aspect-[4/5] bg-ink/5 p-2 shadow-sm relative flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-ink/20">edit_document</span>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center relative">
                    <div className="space-y-4 relative z-10 mt-4 md:mt-0">
                      <h2 className="text-3xl font-display font-medium text-[#A34A4A] leading-tight flex items-center gap-2"><span className="material-symbols-outlined">lock</span> Waiting for entries</h2>
                      <p className="font-display italic text-ink/80 leading-relaxed font-light text-base md:text-lg">
                        The journal is currently empty. Once the author begins writing, the stories will appear here, carefully pinned to the page.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sub-grid for Left Column bottom */}
            <div className="flex flex-col md:flex-row gap-8">

              {/* Card 3: Second Article */}
              {secondArticle ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="sketch-card p-6 pb-8 flex-1 relative tape-top-center"
                >
                  <div className="pin pin-top-center"></div>
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#B3A89E]">Specimen 021</p>
                    <Link to={`/article/${secondArticle.slug}`}>
                      <h3 className="text-2xl font-display font-medium text-[#814C35] hover:text-[#A34A4A] transition-colors">{secondArticle.title}</h3>
                    </Link>
                    <p className="text-ink/70 font-sans text-sm font-light leading-relaxed">
                      {secondArticle.excerpt}
                    </p>

                    <div className="mt-6 aspect-[3/2] bg-[#E8EAE6] flex items-center justify-center relative overflow-hidden">
                      <Link to={`/article/${secondArticle.slug}`} className="w-full h-full block">
                        {secondArticle.coverImage ? (
                          <img src={secondArticle.coverImage} className="w-full h-full object-cover grayscale opacity-80 mix-blend-multiply" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[80px] text-[#D0D6CE]">park</span>
                          </div>
                        )}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="sketch-card p-6 pb-8 flex-1 relative tape-top-center opacity-50 grayscale"
                >
                  <div className="pin pin-top-center"></div>
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#B3A89E]">Specimen Pending</p>
                    <h3 className="text-2xl font-display font-medium text-[#814C35]">Blank Canvas</h3>
                    <p className="text-ink/70 font-sans text-sm font-light leading-relaxed">Awaiting clinical observation to be transcribed...</p>
                    <div className="mt-6 aspect-[3/2] bg-[#E8EAE6] flex items-center justify-center relative overflow-hidden">
                      <span className="material-symbols-outlined text-[80px] text-[#D0D6CE]">medical_services</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Smaller Card below / left side stack - Daily Dose */}
              <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="sketch-card p-6 bg-[#E8EAE6]/40 rotate-[-2deg] tape"
                  style={{ top: '10px' }}
                >
                  <div className="pin pin-top-center top-2"></div>
                  <span className="material-symbols-outlined text-secondary text-sm mb-2 pt-4 block">medical_services</span>
                  <h4 className="font-hand text-lg text-ink/60 mb-2">Daily Dose</h4>
                  <p className="font-hand text-xl text-ink leading-relaxed">
                    {settings.dailyDoseQuote || '"Remember to breathe as deeply as the roots reach."'}
                  </p>
                </motion.div>
              </div>

            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 w-full md:w-[40%] lg:w-[45%]">

            {/* Card 2: Sketchbook Notes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="sketch-card p-8 bg-[#F5F2EA] w-full max-w-sm rotate-1 ml-auto"
            >
              <h3 className="font-hand text-2xl text-accent mb-6">Sketchbook Notes</h3>
              <p className="font-hand text-lg text-ink/80 leading-loose mb-8">
                {settings.sketchbookNotesQuote || '"The way a leaf veins mirror the bronchial tree of our lungs is not a coincidence, but a conversation in the language of growth."'}
              </p>
              <div className="flex flex-col items-center opacity-60">
                <span className="material-symbols-outlined text-4xl text-primary mb-2">eco</span>
                <p className="font-hand text-sm text-ink/60">{settings.sketchbookNotesAuthor || 'Dr. Aria Thorne, 2023'}</p>
              </div>
            </motion.div>

            {/* Card 4: Third Article */}
            {thirdArticle ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="sketch-card p-10 pb-6 w-full mt-4"
              >
                <div className="space-y-4">
                  <p className="font-hand text-accent text-lg">Observation from the field...</p>
                  <h3 className="text-3xl font-display font-medium text-[#814C35]">{thirdArticle.title}</h3>
                  <p className="text-ink/80 font-sans font-light leading-relaxed">
                    {thirdArticle.excerpt}
                  </p>

                  <div className="mt-12 flex items-center justify-between border-t border-ink/10 pt-4">
                    <div className="flex gap-2">
                      <span className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center text-[10px]">&</span>
                    </div>
                    <Link to={`/article/${thirdArticle.slug}`} className="font-hand text-lg text-ink hover:text-primary transition-colors">Read more →</Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="sketch-card p-10 pb-6 w-full mt-4 opacity-50 grayscale"
              >
                <div className="space-y-4">
                  <p className="font-hand text-accent text-lg">Observation pending...</p>
                  <h3 className="text-3xl font-display font-medium text-[#814C35]">Silent Ward</h3>
                  <p className="text-ink/80 font-sans font-light leading-relaxed">
                    No field notes recorded yet. The ward is quiet.
                  </p>
                  <div className="mt-12 flex items-center justify-between border-t border-ink/10 pt-4">
                    <span className="material-symbols-outlined text-[#814C35]/50">edit_note</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>

        {/* Subscription Footer Block */}
        <div className="w-full flex justify-center mt-20 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="sketch-card p-10 max-w-4xl w-full rotate-[-1deg] border-dashed border-[#B3A89E]"
          >
            <div className="flex flex-col md:flex-row gap-10 items-center">

              {/* Profile Image placeholder */}
              <div className="w-32 h-32 rounded-full border-4 border-paper bg-[#E8EAE6] flex-shrink-0 shadow-lg relative overflow-hidden flex items-center justify-center">
                {/* Fallback to icon since we don't have the exact person image */}
                <span className="material-symbols-outlined text-[80px] text-ink/20 transform translate-y-4">person</span>
              </div>

              <div className="flex-1 space-y-4 relative">
                <h3 className="font-hand text-3xl text-primary">{settings.footerTitle}</h3>
                <p className="font-display italic text-lg text-[#814C35]">
                  "{settings.footerQuote}"
                </p>

                <div className="mt-8 flex items-end gap-4 relative z-10 pt-4">
                  <input
                    type="email"
                    placeholder="Leave your address for the next volume..."
                    className="flex-1 bg-transparent border-b border-ink/30 py-2 font-hand text-xl text-ink focus:outline-none focus:border-primary placeholder:text-ink/30"
                  />
                  <button className="bg-primary text-paper px-6 py-2 rounded-sm font-hand text-xl hover:bg-primary-dark transition-colors shadow-sm">
                    Subscribe
                  </button>
                </div>

                {/* Decorative background element behind button */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none z-0 translate-y-8">
                  <span className="material-symbols-outlined text-[100px]">park</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
