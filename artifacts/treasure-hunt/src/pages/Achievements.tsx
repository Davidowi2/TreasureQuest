import { Link, useLocation } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext, ALL_ACHIEVEMENTS, AchievementRarity, Achievement } from "@/context/AppContext";
import { AchievementBadge } from "@/components/AchievementBadge";
import { motion } from "framer-motion";

export default function Achievements() {
  const { currentUser, userAchievements } = useAppContext();
  const [, setLocation] = useLocation();

  const myAchievements = currentUser ? (userAchievements[currentUser.id] || []) : [];
  const earnedIds = new Set(myAchievements.map(a => a.achievementId));

  const getRarityValue = (rarity: AchievementRarity) => {
    switch (rarity) {
      case "common": return 1;
      case "rare": return 2;
      case "epic": return 3;
      case "legendary": return 4;
      default: return 0;
    }
  };

  const earnedAchievements = myAchievements
    .map(ua => ({ ua, def: ALL_ACHIEVEMENTS.find(a => a.id === ua.achievementId)! }))
    .filter(x => x.def !== undefined);

  const rarestTrophy = earnedAchievements.length > 0 
    ? earnedAchievements.reduce((prev, current) => 
        getRarityValue(current.def.rarity) > getRarityValue(prev.def.rarity) ? current : prev
      ).def
    : null;

  const firstUnearned = ALL_ACHIEVEMENTS.find(a => !earnedIds.has(a.id));

  const groupedAchievements = {
    legendary: ALL_ACHIEVEMENTS.filter(a => a.rarity === "legendary"),
    epic: ALL_ACHIEVEMENTS.filter(a => a.rarity === "epic"),
    rare: ALL_ACHIEVEMENTS.filter(a => a.rarity === "rare"),
    common: ALL_ACHIEVEMENTS.filter(a => a.rarity === "common"),
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Earned today";
    if (diffInDays === 1) return "Earned yesterday";
    if (diffInDays < 30) return `Earned ${diffInDays} days ago`;
    return `Earned on ${date.toLocaleDateString()}`;
  };

  const rarityColors = {
    common: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    rare: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    epic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    legendary: "bg-gradient-to-r from-yellow-200 to-amber-200 text-amber-900 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-amber-200 border-yellow-300 dark:border-yellow-700"
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 pb-20">
      <div className="bg-background border-b pt-8 pb-6">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 -ml-2 text-muted-foreground"
            onClick={() => setLocation(currentUser ? "/dashboard/player" : "/hunts")}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to {currentUser ? "Dashboard" : "Hunts"}
          </Button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <Trophy className="text-accent" size={32} />
                My Trophies
              </h1>
              {currentUser ? (
                <div className="flex flex-col gap-2 w-full max-w-sm mt-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{myAchievements.length} of {ALL_ACHIEVEMENTS.length} Unlocked</span>
                    <span>{Math.round((myAchievements.length / ALL_ACHIEVEMENTS.length) * 100)}%</span>
                  </div>
                  <Progress value={(myAchievements.length / ALL_ACHIEVEMENTS.length) * 100} className="h-2" />
                </div>
              ) : (
                <div className="flex items-center gap-4 mt-4 bg-muted/50 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Sign up to track your achievements</p>
                  <Link href="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-card">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Trophies Earned</p>
              <p className="text-3xl font-bold">{myAchievements.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Rarest Trophy</p>
              {rarestTrophy ? (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize border ${rarityColors[rarestTrophy.rarity]}`}>
                    {rarestTrophy.rarity}
                  </span>
                  <span className="font-semibold">{rarestTrophy.title}</span>
                </div>
              ) : (
                <p className="text-xl font-semibold text-muted-foreground">None yet</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Next Trophy</p>
              {firstUnearned ? (
                <div>
                  <p className="font-semibold truncate">{firstUnearned.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{firstUnearned.howTo}</p>
                </div>
              ) : (
                <p className="text-xl font-semibold text-emerald-500">All Completed!</p>
              )}
            </CardContent>
          </Card>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
          {(Object.entries(groupedAchievements) as [AchievementRarity, Achievement[]][]).map(([rarity, achievements]) => {
            const count = achievements.filter(a => earnedIds.has(a.id)).length;
            
            return (
              <div key={rarity} className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-2">
                  <h2 className="text-2xl font-bold capitalize">{rarity}</h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {count} / {achievements.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {achievements.map(achievement => {
                    const isEarned = earnedIds.has(achievement.id);
                    const earnedRecord = myAchievements.find(a => a.achievementId === achievement.id);
                    
                    return (
                      <motion.div key={achievement.id} variants={item}>
                        <Card className={`h-full overflow-hidden transition-all duration-300 ${isEarned ? 'border-primary/20 hover:border-primary/40 bg-card shadow-sm' : 'bg-muted/30 border-dashed border-muted-foreground/30'}`}>
                          {isEarned && (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                          )}
                          <CardContent className="p-6 flex flex-col items-center text-center relative z-10">
                            <div className="mb-4">
                              <AchievementBadge 
                                achievement={achievement} 
                                earned={isEarned} 
                                size="lg" 
                              />
                            </div>
                            
                            <h3 className={`font-bold text-lg mb-1 ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {achievement.title}
                            </h3>
                            
                            <div className="mt-2 mb-4 flex-grow">
                              {isEarned ? (
                                <p className="text-sm text-foreground/80">{achievement.description}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">{achievement.howTo}</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 mt-auto w-full pt-4 border-t border-border/50">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${isEarned ? rarityColors[achievement.rarity] : 'bg-muted text-muted-foreground border-transparent'}`}>
                                {achievement.rarity}
                              </span>
                              
                              {isEarned && earnedRecord ? (
                                <span className="text-[11px] text-muted-foreground">
                                  {formatRelativeTime(earnedRecord.earnedAt)}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1">
                                  Locked
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>

        {firstUnearned && (
          <div className="mt-16 text-center space-y-4">
            <p className="text-muted-foreground text-lg">Keep exploring to unlock more trophies!</p>
            <Link href="/hunts">
              <Button size="lg" className="px-8 shadow-sm">Browse Hunts</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}