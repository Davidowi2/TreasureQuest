import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ConfettiEffect() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string }>>([]);

  useEffect(() => {
    const colors = ["#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0 w-3 h-3 rounded-full"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, scale: 0 }}
          animate={{
            y: "100vh",
            opacity: 0,
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            delay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}
