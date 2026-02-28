import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-10 px-6 lg:px-12 mt-20 relative z-10 bg-cream">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg">local_florist</span>
          <p className="text-xs font-bold tracking-widest uppercase text-[#9e5d42]" style={{ letterSpacing: '0.25em' }}>
            MYMEDITALKS ARCHIVE © 2026
          </p>
        </div>

        {/* Center: Handwriting Quote */}
        <div className="text-center md:absolute md:left-1/2 md:-translate-x-1/2">
          <p className="font-hand text-ink/50 text-xl opacity-70">
            Handsketched with care for the curious mind.
          </p>
        </div>

        {/* Right: Social Links in Handwriting */}
        <div className="flex items-center gap-8">
          <a href="#" className="font-hand text-xl text-ink/70 hover:text-primary transition-colors">Twitter</a>
          <a href="#" className="font-hand text-xl text-ink/70 hover:text-primary transition-colors">Instagram</a>
          <a href="#" className="font-hand text-xl text-ink/70 hover:text-primary transition-colors">Field Notes</a>
        </div>

      </div>
    </footer>
  );
}
