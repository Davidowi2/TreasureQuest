import { Compass, Users, RefreshCw, MapPin, Flame, Target, Zap, Brain, Camera, Timer, Layers, Crown, Lock, Trophy } from "lucide-react";
import { Achievement } from "@/context/AppContext";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Compass, Users, RefreshCw, MapPin, Flame, Target, Zap, Brain, Camera, Timer, Layers, Crown
};

interface AchievementBadgeProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
}

export function AchievementBadge({ achievement, earned, size = "md", showLabel = false, animate = false }: AchievementBadgeProps) {
  const IconComponent = iconMap[achievement.icon] || Trophy;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-[72px] h-[72px]",
    lg: "w-24 h-24"
  };

  const iconSizes = {
    sm: 20,
    md: 32,
    lg: 48
  };

  const rarityStyles = {
    common: "bg-blue-500/20 border-blue-300 text-blue-500",
    rare: "bg-violet-500/20 border-violet-400 text-violet-600",
    epic: "bg-amber-500/20 border-amber-400 text-amber-600",
    legendary: "bg-gradient-to-tr from-yellow-400/30 to-amber-500/30 border-yellow-400 text-amber-600"
  };

  const lockedStyles = "bg-muted border-muted-foreground/30 text-muted-foreground grayscale brightness-50";

  const containerClasses = `relative flex items-center justify-center rounded-full border-2 shadow-sm ${sizeClasses[size]} ${earned ? rarityStyles[achievement.rarity] : lockedStyles}`;

  const content = (
    <div className="flex flex-col items-center gap-2">
      <div className={containerClasses} data-testid={`achievement-badge-${achievement.id}`}>
        <IconComponent size={iconSizes[size]} className="drop-shadow-sm" />
        {!earned && (
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-muted-foreground shadow-sm">
            <Lock size={size === "sm" ? 12 : size === "md" ? 16 : 20} className="text-muted-foreground" />
          </div>
        )}
      </div>
      {showLabel && (
        <span className={`text-center font-medium ${size === "sm" ? "text-[10px] leading-tight" : "text-sm"} ${earned ? "text-foreground" : "text-muted-foreground"}`}>
          {achievement.title}
        </span>
      )}
    </div>
  );

  if (animate && earned) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.div
          animate={{ boxShadow: ["0px 0px 0px 0px rgba(251, 191, 36, 0)", "0px 0px 20px 5px rgba(251, 191, 36, 0.4)", "0px 0px 0px 0px rgba(251, 191, 36, 0)"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="rounded-full"
        >
          {content}
        </motion.div>
      </motion.div>
    );
  }

  return content;
}