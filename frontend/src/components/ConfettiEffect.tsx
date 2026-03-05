import React, { useEffect, useRef, useCallback } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  gravity: number;
  friction: number;
  opacity: number;
  shape: 'square' | 'circle' | 'strip';
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#FF69B4', '#00CED1', '#FFD700', '#32CD32', '#FF6347'
];

export default function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const hasTriggeredRef = useRef(false);

  const createConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3;

    // Create burst of confetti
    for (let i = 0; i < 150; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const velocity = Math.random() * 15 + 8;
      const shapes: ('square' | 'circle' | 'strip')[] = ['square', 'circle', 'strip'];

      const piece: ConfettiPiece = {
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 50,
        size: Math.random() * 8 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        speedX: Math.cos(angle) * velocity * (Math.random() + 0.5),
        speedY: Math.sin(angle) * velocity * (Math.random() + 0.5) - 5,
        gravity: 0.3,
        friction: 0.99,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      };

      particlesRef.current.push(piece);
    }
  }, []);

  useEffect(() => {
    if (trigger && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      createConfetti();
    }
  }, [trigger, createConfetti]);

  useEffect(() => {
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

    function drawPiece(ctx: CanvasRenderingContext2D, piece: ConfettiPiece) {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.globalAlpha = piece.opacity;
      ctx.fillStyle = piece.color;

      switch (piece.shape) {
        case 'square':
          ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'strip':
          ctx.fillRect(-piece.size / 2, -piece.size * 1.5, piece.size, piece.size * 3);
          break;
      }

      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      particlesRef.current = particlesRef.current.filter(piece => {
        // Update physics
        piece.speedY += piece.gravity;
        piece.speedX *= piece.friction;
        piece.speedY *= piece.friction;
        piece.x += piece.speedX;
        piece.y += piece.speedY;
        piece.rotation += piece.rotationSpeed;

        // Fade out when below screen
        if (piece.y > canvas!.height - 50) {
          piece.opacity -= 0.02;
        }

        // Draw
        if (piece.opacity > 0) {
          drawPiece(ctx, piece);
          return true;
        }
        return false;
      });

      // Continue animation or complete
      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasTriggeredRef.current = false;
        onComplete?.();
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onComplete]);

  if (!trigger && particlesRef.current.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
}
