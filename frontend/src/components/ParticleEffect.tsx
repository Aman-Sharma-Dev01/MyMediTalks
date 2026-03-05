import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'petal' | 'leaf';
  color: string;
  swayOffset: number;
  swaySpeed: number;
}

const COLORS = {
  petal: ['#FFB7C5', '#FFC0CB', '#FFD1DC', '#FADADD', '#F8C8DC'],
  leaf: ['#90B77D', '#A5C882', '#7EAA92', '#8FB996', '#9DC08B']
};

export default function ParticleEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const windRef = useRef({ strength: 0, target: 0 });
  const [enabled, setEnabled] = useState(true);

  // Check localStorage for particle toggle state
  useEffect(() => {
    const stored = localStorage.getItem('particlesEnabled');
    if (stored !== null) {
      setEnabled(stored === 'true');
    }
    
    // Listen for storage changes (from admin dashboard)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'particlesEnabled') {
        setEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Also listen for custom event (same-tab updates)
    const handleCustom = () => {
      const val = localStorage.getItem('particlesEnabled');
      setEnabled(val !== 'false');
    };
    window.addEventListener('particlesToggled', handleCustom);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('particlesToggled', handleCustom);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles spread across the screen
    const particleCount = Math.min(30, Math.floor(window.innerWidth / 50));
    
    for (let i = 0; i < particleCount; i++) {
      createParticle(true);
    }

    // Wind effect - changes direction periodically (gentle breeze)
    const windInterval = setInterval(() => {
      windRef.current.target = (Math.random() - 0.5) * 1.5;
    }, 4000);

    function createParticle(initial = false) {
      const type = Math.random() > 0.7 ? 'leaf' : 'petal';
      const colors = type === 'petal' ? COLORS.petal : COLORS.leaf;
      
      // Spawn from top across the full width, or random position if initial
      const spawnFromTop = !initial || Math.random() > 0.5;
      
      const particle: Particle = {
        x: initial 
          ? Math.random() * canvas!.width 
          : Math.random() * canvas!.width, // Spawn across full width
        y: initial 
          ? Math.random() * canvas!.height 
          : spawnFromTop ? -20 : Math.random() * canvas!.height * 0.2, // Spawn from top
        size: Math.random() * 8 + 6,
        speedX: (Math.random() - 0.5) * 0.8, // Random horizontal drift (both directions)
        speedY: Math.random() * 0.6 + 0.4, // Gentle downward fall
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 3,
        opacity: Math.random() * 0.4 + 0.3,
        type,
        color: colors[Math.floor(Math.random() * colors.length)],
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01
      };
      
      particlesRef.current.push(particle);
    }

    function drawPetal(ctx: CanvasRenderingContext2D, particle: Particle) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = particle.opacity;
      
      // Cherry blossom petal shape
      ctx.beginPath();
      ctx.fillStyle = particle.color;
      
      // Create petal shape
      ctx.moveTo(0, -particle.size / 2);
      ctx.bezierCurveTo(
        particle.size / 2, -particle.size / 2,
        particle.size / 2, particle.size / 3,
        0, particle.size / 2
      );
      ctx.bezierCurveTo(
        -particle.size / 2, particle.size / 3,
        -particle.size / 2, -particle.size / 2,
        0, -particle.size / 2
      );
      ctx.fill();
      
      // Add subtle gradient/shadow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, -particle.size / 6, particle.size / 4, particle.size / 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    function drawLeaf(ctx: CanvasRenderingContext2D, particle: Particle) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = particle.opacity;
      
      // Leaf shape
      ctx.beginPath();
      ctx.fillStyle = particle.color;
      
      ctx.moveTo(0, -particle.size);
      ctx.bezierCurveTo(
        particle.size / 2, -particle.size / 2,
        particle.size / 2, particle.size / 2,
        0, particle.size
      );
      ctx.bezierCurveTo(
        -particle.size / 2, particle.size / 2,
        -particle.size / 2, -particle.size / 2,
        0, -particle.size
      );
      ctx.fill();
      
      // Leaf vein
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -particle.size * 0.8);
      ctx.lineTo(0, particle.size * 0.8);
      ctx.stroke();
      
      ctx.restore();
    }

    function animate(time: number) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      
      // Smooth wind transition
      windRef.current.strength += (windRef.current.target - windRef.current.strength) * 0.01;
      
      particlesRef.current.forEach((particle, index) => {
        // Apply wind and sway
        const sway = Math.sin(time * particle.swaySpeed + particle.swayOffset) * 1.5;
        
        particle.x += particle.speedX + windRef.current.strength * 0.5 + sway * 0.3;
        particle.y += particle.speedY + Math.abs(sway) * 0.05;
        particle.rotation += particle.rotationSpeed + windRef.current.strength;
        
        // Draw particle
        if (particle.type === 'petal') {
          drawPetal(ctx, particle);
        } else {
          drawLeaf(ctx, particle);
        }
        
        // Remove if off screen (any edge) and create new one from top
        if (
          particle.y > canvas!.height + 50 || 
          particle.x < -50 || 
          particle.x > canvas!.width + 50
        ) {
          particlesRef.current.splice(index, 1);
          createParticle();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(windInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[5]"
      style={{ opacity: 0.8 }}
    />
  );
}
