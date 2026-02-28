import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../lib/api';

export default function AboutPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
      } catch (error) {
        console.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-display text-xl text-ink">Loading profile...</div>;

  return (
    <main className="flex flex-1 flex-col items-center w-full max-w-5xl mx-auto px-6 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col md:flex-row gap-12 items-center md:items-start w-full mb-16"
      >
        <div className="relative shrink-0 group">
          <div className="absolute inset-0 bg-primary/20 translate-x-3 translate-y-3 rounded-xl transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
          <div className="relative w-64 h-80 md:w-80 md:h-96 rounded-xl overflow-hidden border border-primary/20 shadow-lg">
            <img
              src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAtV2ZdjIf_N_SezP_EuFqLEii0VvQq1QaS4u2ZNj7TkjgjcizTe8fYuyMbzhVanycltF_2oZdq2lMSCXkZ8LQqjPrZSKP6Pdo9SerkUQxWTA1FJDHSDbZDqk9n8QLjqilr1j7W2e1X9N9bTaAlTiarXz9AT5RaGAImTyJ94JEaLlbrzBKJcybDIx6LsUY0BNu7nfuXKbo-yv-mcJmLKvZ2JecrFJ3IuvC-182fZE6-qtLQSpbsvb8J9c1Y2lo4cFT0S4FYVApLc9mL"}
              alt={user?.name || "Dr. Elena Vance"}
              className="w-full h-full object-cover transition-all duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center pt-4">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold font-sans">Editor-in-Chief</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display italic text-ink mb-6 leading-none tracking-tight">
            {user?.name || "Dr. Elena Vance"}
          </h1>
          <p className="text-lg md:text-xl text-secondary font-light mb-8 max-w-lg leading-relaxed whitespace-pre-wrap">
            {user?.bio || "Cardiologist, medical writer, and observer of the quiet moments where science meets the fragility of life."}
          </p>
          <div className="flex gap-6">
            <button className="text-secondary hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest font-sans">
              <span className="material-symbols-outlined text-lg">mail</span> Contact
            </button>
            <button className="text-secondary hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest font-sans">
              <span className="material-symbols-outlined text-lg">public</span> Portfolio
            </button>
          </div>
        </div>
      </motion.div>

      <div className="w-full flex items-center justify-center py-12 opacity-40">
        <div className="h-px bg-primary/30 w-1/4"></div>
        <span className="material-symbols-outlined px-6 text-primary text-3xl">local_florist</span>
        <div className="h-px bg-primary/30 w-1/4"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="max-w-3xl flex flex-col gap-8 text-lg md:text-xl text-ink/80 leading-relaxed font-display text-justify md:text-left"
      >
        <p className="drop-cap whitespace-pre-wrap">
          {user?.aboutText || 'MyMediTalks began as a collection of quiet observations from the hospital wards—moments where rigid protocols gave way to the profound, unpredictable nature of human healing. What started as private journal entries scribbled between rounds has grown into this editorial space.\n\nI have always believed that medicine is as much an art as it is a science. While my training in cardiology taught me the mechanics of the heart, my patients taught me its capacity for resilience. This journal is dedicated to the thoughtful exploration of modern medicine, patient stories, and the healing arts.'}
        </p>
      </motion.div>

      <div className={`w-full grid grid-cols-1 ${user?.aboutImages?.length === 1 ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'} gap-8 my-24`}>
        {(user?.aboutImages || [
          { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBW06eC7TUYHIeI8ylW_S5_cCKAW05xT2vUEXGGMYhFIMkMHlHx3eOx87uvvsxOjSAs2u8BugZa8eAXDVtdyLpbaULg32Kwi-OvDCqkW4J0ybxDcNkW1UK8-7fox3vy3InvpCNfw76A_xUabJsq7KMJCHcVS5IPlk5ql0L40tr8TV5hPcnrX0UooI5ydE0r0qlI2vVWNKSkuy7c4cN-h-UOtAgtsvLUYwKsnmTolE_FW_y2uHPx3hx_PcdbhCds-8QrXZsbeuKRQEQ4", alt: "Medical setup" },
          { url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5NbYfIJZ-MKdvkbndM26wrN2PWDNtsngKivWlyEGW0JGaqOTCltZlrGCLc6K2i61LQc6vbNcruHAyT3KHeOPpopScC2_qRx-wmPiUfTwSZUreWty-rOgtcgl3hTRN04nDUgGL52-SWGp31cj5LeSeiMqKC7C9EVaTldhggYoMecxwwYS3BEJGHeaJLifOrThZzEL8ZYdhooM_SmGXud-0DFoG-Xp0Po94IjK5DQvw1aS4JqAc6ciMCpUmj1hWyVNuTKqqqPVcwI2k", alt: "Botanical herbs" }
        ]).map((img: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index % 2 === 0 ? 0 : 0.2 }}
            className={`relative ${user?.aboutImages?.length === 1 ? 'aspect-[16/9]' : 'aspect-[4/3]'} rounded-2xl overflow-hidden group shadow-xl`}
          >
            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10"></div>
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-3xl bg-white p-8 rounded-xl border border-primary/10 shadow-sm mt-8">
        <h3 className="text-xl font-bold text-ink mb-6 border-b border-primary/20 pb-2">Professional Path</h3>
        <ul className="space-y-6">
          {(user?.professionalPath || [{ year: '2018 — Present', title: 'Attending Cardiologist', subtitle: "St. Mary's Teaching Hospital" }, { year: '2015', title: 'Fellowship in Narrative Medicine', subtitle: 'Columbia University' }]).map((path: any, index: number) => (
            <li key={index} className="flex gap-4">
              <div className={`mt-1 min-w-[4px] h-[4px] rounded-full ${index === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-primary/60'}`}></div>
              <div>
                <span className={`block text-sm font-bold ${index === 0 ? 'text-primary' : 'text-primary/80'} tracking-wide`}>{path.year}</span>
                <span className="block text-lg font-medium text-ink">{path.title}</span>
                <span className="text-secondary italic">{path.subtitle}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
