import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function PixelBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; duration: number }>>([]);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; duration: number }>>([]);

  useEffect(() => {
    const colors = ["#00FFB3", "#00C8FF", "#FF4FD8"];
    
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.floor(Math.random() * 3) + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 4 + 2
    }));
    
    const newStars = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10
    }));

    setParticles(newParticles);
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
      <div className="absolute inset-0 scanline opacity-40 z-10"></div>
      
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full opacity-50"
          style={{ width: "1px", height: "1px", left: `${star.x}%`, top: `${star.y}%` }}
          animate={{
            y: [`${star.y}%`, `${star.y - 10}%`, `${star.y}%`],
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
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`
          }}
          animate={{
            y: [`${p.y}%`, `${p.y - 5}%`, `${p.y}%`],
            opacity: [0, 0.8, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
}
