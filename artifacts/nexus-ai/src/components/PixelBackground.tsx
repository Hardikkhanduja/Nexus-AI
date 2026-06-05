import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function PixelBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; duration: number }>>([]);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; duration: number }>>([]);

  useEffect(() => {
    const colors = ["#00FFB3", "#00C8FF", "#FF4FD8"];
    
    // Bigger pixel particles
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.floor(Math.random() * 5) + 6, // 6-10px squares
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 4 + 4
    }));
    
    // Tiny drifting star dots
    const newStars = Array.from({ length: 15 }).map((_, i) => ({
      id: i + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15
    }));

    setParticles(newParticles);
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
      <div className="absolute inset-0 scanline opacity-40 z-10"></div>
      
      {/* Pixel grid overlay */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,179,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,179,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 4 thick corner bracket decorations */}
      <div className="absolute top-4 left-4 w-[40px] h-[40px] border-t-[4px] border-l-[4px] border-[#00FFB3] z-10"></div>
      <div className="absolute top-4 right-4 w-[40px] h-[40px] border-t-[4px] border-r-[4px] border-[#00FFB3] z-10"></div>
      <div className="absolute bottom-4 left-4 w-[40px] h-[40px] border-b-[4px] border-l-[4px] border-[#00FFB3] z-10"></div>
      <div className="absolute bottom-4 right-4 w-[40px] h-[40px] border-b-[4px] border-r-[4px] border-[#00FFB3] z-10"></div>

      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full opacity-50"
          style={{ width: "2px", height: "2px", left: `${star.x}%`, top: `${star.y}%` }}
          animate={{
            x: [`${star.x}%`, `${star.x + 5}%`, `${star.x}%`],
            y: [`${star.y}%`, `${star.y - 5}%`, `${star.y}%`],
            opacity: [0.2, 0.8, 0.2]
          }}
          transition={{ duration: star.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ 
            width: `${p.size}px`, 
            height: `${p.size}px`, 
            left: `${p.x}%`, 
            top: `${p.y}%`,
            backgroundColor: p.color,
          }}
          animate={{
            y: [`${p.y}%`, `${p.y - 10}%`, `${p.y}%`],
            rotate: [0, 90, 180, 270, 360],
            opacity: [0, 0.7, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
}