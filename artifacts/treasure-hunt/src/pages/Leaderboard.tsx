import { useState, useMemo } from "react";
import { Trophy, Clock, AlertTriangle, Calendar, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HuntTypeBadge } from "@/components/HuntTypeBadge";
import { HuntCard } from "@/components/HuntCard";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

type SortOption = "fastest" | "fewest-mistakes" | "recent";

export default function Leaderboard() {
  const { teams, hunts } = useAppContext();
  
  const [selectedHunt, setSelectedHunt] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("fastest");

  const publishedHunts = hunts.filter(h => h.status === "published");
  
  const completedTeams = useMemo(() => {
    let filtered = teams.filter(t => t.status === "complete" && t.totalTime !== undefined);
    
    if (selectedHunt !== "all") {
      filtered = filtered.filter(t => t.huntId === selectedHunt);
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === "fastest") return (a.totalTime || 0) - (b.totalTime || 0);
      if (sortBy === "fewest-mistakes") return a.failedAttempts - b.failedAttempts;
      if (sortBy === "recent") return new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime();
      return 0;
    });
  }, [teams, selectedHunt, sortBy]);

  const uniquePlayers = new Set(teams.filter(t => t.status === "complete").flatMap(t => t.members.map(m => m.userId))).size;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="text-center mb-12 mt-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block p-4 bg-accent/10 rounded-full text-accent mb-4">
          <Trophy size={48} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Global Leaderboard</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The fastest adventurers across all hunts.
        </p>
        
        <div className="flex justify-center gap-8 mt-8 text-sm font-medium text-muted-foreground">
          <div className="flex flex-col items-center"><span className="text-2xl font-bold text-foreground">{publishedHunts.length}</span> Hunts</div>
          <div className="flex flex-col items-center"><span className="text-2xl font-bold text-foreground">{teams.filter(t=>t.status==='complete').length}</span> Completions</div>
          <div className="flex flex-col items-center"><span className="text-2xl font-bold text-foreground">{uniquePlayers}</span> Explorers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex-1">
          <Select value={selectedHunt} onValueChange={setSelectedHunt}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="All Hunts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hunts</SelectItem>
              {publishedHunts.map(h => (
                <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:w-64">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fastest"><div className="flex items-center gap-2"><Clock size={16}/> Fastest Time</div></SelectItem>
              <SelectItem value="fewest-mistakes"><div className="flex items-center gap-2"><AlertTriangle size={16}/> Fewest Mistakes</div></SelectItem>
              <SelectItem value="recent"><div className="flex items-center gap-2"><Calendar size={16}/> Most Recent</div></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leaderboard Table */}
      {completedTeams.length > 0 ? (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm mb-16">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Rank</th>
                  <th className="px-6 py-4 font-semibold">Team</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Hunt</th>
                  <th className="px-6 py-4 font-semibold">Members</th>
                  <th className="px-6 py-4 font-semibold">Time</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Mistakes</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <motion.tbody 
                className="divide-y"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {completedTeams.map((team, idx) => {
                  const hunt = hunts.find(h => h.id === team.huntId);
                  return (
                    <motion.tr key={team.id} variants={itemVariants} className="hover:bg-muted/30 transition-colors bg-card">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' : 
                          idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : 
                          idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {idx === 0 ? <Medal size={16}/> : idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-base">{team.name}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {hunt && (
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-medium truncate max-w-[200px]">{hunt.title}</span>
                            <HuntTypeBadge type={hunt.huntType} className="scale-90 origin-left" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 3).map(m => (
                            <Avatar key={m.userId} className="w-8 h-8 border-2 border-card shadow-sm">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {m.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {team.members.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-card text-[10px] font-medium z-10 relative shadow-sm">
                              +{team.members.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-base">
                        {formatTime(team.totalTime!)}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          team.failedAttempts === 0 ? 'bg-emerald-100 text-emerald-700' : 
                          team.failedAttempts > 3 ? 'bg-destructive/10 text-destructive' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {team.failedAttempts} fails
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                        {team.completedAt ? new Date(team.completedAt).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : 'Unknown'}
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed mb-16">
          <Trophy size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No teams found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            No teams match your current filters. Try selecting a different hunt or check back later!
          </p>
        </div>
      )}

      {/* Play These Hunts Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold">Play These Hunts</h2>
          <div className="h-px bg-border flex-grow mt-1" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {publishedHunts.slice(0, 4).map(hunt => (
            <HuntCard key={hunt.id} hunt={hunt} />
          ))}
        </div>
      </section>
    </div>
  );
}
