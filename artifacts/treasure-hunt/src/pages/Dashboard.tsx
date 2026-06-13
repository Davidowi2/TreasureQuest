import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Trophy, Play, Compass, PenTool, LayoutDashboard, Clock, Target, Award, Users } from "lucide-react";
import { useAppContext, ALL_ACHIEVEMENTS } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AchievementBadge } from "@/components/AchievementBadge";
import { HuntTypeBadge } from "@/components/HuntTypeBadge";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { currentUser, teams, hunts, userAchievements } = useAppContext();

  useEffect(() => {
    if (!currentUser) {
      setLocation("/login");
    }
  }, [currentUser, setLocation]);

  if (!currentUser) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Stats
  const myCompletedTeams = teams.filter(t => t.status === "complete" && t.members.some(m => m.userId === currentUser.id));
  const myActiveTeams = teams.filter(t => (t.status === "active" || t.status === "lobby") && t.members.some(m => m.userId === currentUser.id));
  const myAchievements = userAchievements[currentUser.id] || [];
  
  const cluesSolved = myCompletedTeams.reduce((sum, t) => {
    const hunt = hunts.find(h => h.id === t.huntId);
    return sum + (hunt ? hunt.clues.length : 0);
  }, 0) + myActiveTeams.reduce((sum, t) => sum + t.currentClueIndex, 0);

  const completedHuntIds = new Set(myCompletedTeams.map(t => t.huntId));
  const recommendedHunts = hunts.filter(h => h.status === "published" && !completedHuntIds.has(h.id)).slice(0, 3);
  const displayHunts = recommendedHunts.length > 0 ? recommendedHunts : hunts.filter(h => h.status === "published").slice(0, 3);

  const isCreator = currentUser.role === "creator" || currentUser.role === "both";
  const myHunts = isCreator ? hunts.filter(h => h.creatorId === currentUser.id) : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Header Row */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {greeting}, {currentUser.name}!
            </h1>
            <Badge variant="secondary" className="capitalize">{currentUser.role}</Badge>
          </div>
          <div className="flex gap-3">
            <Link href="/hunts">
              <Button variant="outline"><Compass className="mr-2" size={16} /> Browse Hunts</Button>
            </Link>
            {isCreator && (
              <Link href="/hunts/new">
                <Button><PenTool className="mr-2" size={16} /> New Hunt</Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Hunts Completed</p>
                <Target size={16} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{myCompletedTeams.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Trophies Earned</p>
                <Award size={16} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold">{myAchievements.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Clues Solved</p>
                <Compass size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold">{cluesSolved}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Active Teams</p>
                <Users size={16} className="text-violet-500" />
              </div>
              <p className="text-2xl font-bold">{myActiveTeams.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Teams */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Play className="text-primary" />
            <h2 className="text-2xl font-bold">Continue Playing</h2>
          </div>
          
          {myActiveTeams.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {myActiveTeams.map(team => {
                const hunt = hunts.find(h => h.id === team.huntId);
                if (!hunt) return null;
                const progress = (team.currentClueIndex / hunt.clues.length) * 100;
                
                return (
                  <Card key={team.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{team.name}</h3>
                            <Badge variant="outline" className="text-[10px]">{team.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{hunt.title}</p>
                        </div>
                        <HuntTypeBadge type={hunt.huntType} className="scale-90 origin-top-right" />
                      </div>
                      
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Clue {team.currentClueIndex + 1} of {hunt.clues.length}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <Link href={team.status === "active" ? `/game/${team.id}` : `/team/${team.id}/lobby`}>
                        <Button className="w-full" variant={team.status === "active" ? "default" : "secondary"}>
                          {team.status === "active" ? "Resume Game" : "Go to Lobby"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <Compass className="text-muted-foreground mb-3 opacity-50" size={32} />
                <h3 className="font-semibold mb-1">Ready for an adventure?</h3>
                <p className="text-sm text-muted-foreground mb-4">Browse hunts to get started!</p>
                <Link href="/hunts">
                  <Button variant="outline">Browse Hunts</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Achievements Shelf */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="text-amber-500" />
              <h2 className="text-2xl font-bold">Trophies</h2>
              <Badge variant="secondary">{myAchievements.length}</Badge>
            </div>
            {myAchievements.length > 0 && (
              <Link href="/achievements" className="text-sm text-primary hover:underline font-medium">
                View All
              </Link>
            )}
          </div>

          {myAchievements.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 -mx-2 snap-x">
              {myAchievements.slice(0, 8).map(ua => {
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === ua.achievementId);
                if (!achievement) return null;
                return (
                  <div key={ua.achievementId} className="snap-start shrink-0">
                    <AchievementBadge achievement={achievement} earned={true} size="sm" showLabel />
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-8 text-center">
                <Trophy className="text-muted-foreground mb-3 opacity-50 mx-auto" size={32} />
                <p className="text-muted-foreground text-sm">Complete your first hunt to earn trophies!</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Discover Hunts */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Compass className="text-primary" />
            <h2 className="text-2xl font-bold">Discover</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {displayHunts.map(hunt => (
              <Card key={hunt.id} className="flex flex-col">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <HuntTypeBadge type={hunt.huntType} className="scale-90 origin-top-left" />
                    <Badge variant="outline" className="capitalize">{hunt.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{hunt.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-2">{hunt.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link href={`/hunts/${hunt.id}/join`} className="w-full">
                    <Button variant="secondary" className="w-full">Join Hunt</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Creator Panel */}
        {isCreator && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PenTool className="text-primary" />
                <h2 className="text-2xl font-bold">Your Hunts</h2>
              </div>
              <Link href="/dashboard/creator" className="text-sm text-primary hover:underline font-medium">
                Manage
              </Link>
            </div>
            
            <Card>
              {myHunts.length > 0 ? (
                <div className="divide-y">
                  {myHunts.slice(0, 5).map(hunt => (
                    <div key={hunt.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-semibold">{hunt.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="capitalize flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${hunt.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {hunt.status}
                          </span>
                          <span>•</span>
                          <span>{hunt.clues.length} clues</span>
                          <span>•</span>
                          <span>{hunt.totalPlayers} players</span>
                        </div>
                      </div>
                      <Link href={`/hunts/${hunt.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <CardContent className="p-8 text-center flex flex-col items-center">
                  <PenTool className="text-muted-foreground mb-3 opacity-50" size={32} />
                  <p className="text-muted-foreground mb-4">You haven't created any hunts yet.</p>
                  <Link href="/hunts/new">
                    <Button><PenTool className="mr-2" size={16} /> Create Your First Hunt</Button>
                  </Link>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
