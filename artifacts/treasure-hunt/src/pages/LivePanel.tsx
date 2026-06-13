import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Radio, Megaphone, CheckCircle2, XCircle, Trophy, UserPlus, Lightbulb, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ActivityEvent = {
  id: string;
  timestamp: Date;
  type: "clue_solved" | "clue_failed" | "hunt_complete" | "team_joined" | "hint_sent" | "broadcast";
  teamName: string;
  teamColor: string;
  message: string;
};

const getTeamColor = (teamId: string) => {
  const hue = teamId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const getAvatarColor = (userId: string) => {
  const hue = (userId.charCodeAt(0) * 17) % 360;
  return `hsl(${hue}, 55%, 55%)`;
};

export default function LivePanel() {
  const [, params] = useRoute("/hunt/:huntId/live");
  const huntId = params?.huntId;
  const [, setLocation] = useLocation();
  const { hunts, teams, setTeams, currentUser, sendMessage } = useAppContext();
  const { toast } = useToast();

  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [broadcastText, setBroadcastText] = useState("");
  const [activeHintTeamId, setActiveHintTeamId] = useState<string | null>(null);
  const [hintText, setHintText] = useState("");
  const [now, setNow] = useState(new Date());

  const feedEndRef = useRef<HTMLDivElement>(null);

  const hunt = hunts.find(h => h.id === huntId);
  const huntTeams = teams.filter(t => t.huntId === huntId);

  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activityFeed.length]);

  useEffect(() => {
    if (!hunt) return;

    const initialEvents: ActivityEvent[] = [];
    huntTeams.forEach(team => {
      const color = getTeamColor(team.id);
      if (team.status === "complete") {
        initialEvents.push({
          id: `init-${team.id}-comp`,
          timestamp: new Date(team.completedAt || Date.now()),
          type: "hunt_complete",
          teamName: team.name,
          teamColor: color,
          message: `${team.name} completed the hunt!`,
        });
      } else if (team.currentClueIndex > 0) {
        initialEvents.push({
          id: `init-${team.id}-clue`,
          timestamp: new Date(team.startTime || Date.now()),
          type: "clue_solved",
          teamName: team.name,
          teamColor: color,
          message: `${team.name} is on clue ${team.currentClueIndex + 1}`,
        });
      }
    });

    initialEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setActivityFeed(initialEvents);

  }, [huntId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());

      const currentSeconds = Math.floor(Date.now() / 1000);
      if (currentSeconds % 3 === 0 && hunt) {
        const activeTeamsList = huntTeams.filter(t => t.status === "active");
        if (activeTeamsList.length > 0) {
          const rand = Math.random();
          if (rand > 0.6) {
            const randomTeam = activeTeamsList[Math.floor(Math.random() * activeTeamsList.length)];
            const color = getTeamColor(randomTeam.id);
            
            if (rand <= 0.85) {
              setTeams(prev => prev.map(t => {
                if (t.id === randomTeam.id) {
                  return { ...t, failedAttempts: t.failedAttempts + 1 };
                }
                return t;
              }));
              setActivityFeed(prev => [...prev, {
                id: `sim-${Date.now()}`,
                timestamp: new Date(),
                type: "clue_failed",
                teamName: randomTeam.name,
                teamColor: color,
                message: `${randomTeam.name} failed an attempt on Clue ${randomTeam.currentClueIndex + 1}`,
              }]);
            } else {
              setTeams(prev => prev.map(t => {
                if (t.id === randomTeam.id) {
                  const newIndex = t.currentClueIndex + 1;
                  if (newIndex >= hunt.clues.length) {
                    setActivityFeed(prevFeed => [...prevFeed, {
                      id: `sim-${Date.now()}`,
                      timestamp: new Date(),
                      type: "hunt_complete",
                      teamName: randomTeam.name,
                      teamColor: color,
                      message: `🏆 ${randomTeam.name} completed the hunt!`,
                    }]);
                    return { ...t, currentClueIndex: newIndex, status: "complete", completedAt: new Date().toISOString() };
                  } else {
                    setActivityFeed(prevFeed => [...prevFeed, {
                      id: `sim-${Date.now()}`,
                      timestamp: new Date(),
                      type: "clue_solved",
                      teamName: randomTeam.name,
                      teamColor: color,
                      message: `${randomTeam.name} solved Clue ${newIndex}!`,
                    }]);
                    return { ...t, currentClueIndex: newIndex, failedAttempts: 0 };
                  }
                }
                return t;
              }));
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [huntTeams, hunt, setTeams]);


  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  if (!hunt) {
    return <div className="p-8 text-center text-gray-100 bg-gray-950 min-h-screen">Hunt not found.</div>;
  }

  if (hunt.creatorId !== currentUser.id) {
    return <div className="p-8 text-center text-gray-100 bg-gray-950 min-h-screen">Not your hunt.</div>;
  }

  const activeTeamsCount = huntTeams.filter(t => t.status === "active").length;
  const completedTeamsCount = huntTeams.filter(t => t.status === "complete").length;
  
  const firstStartTime = huntTeams.filter(t => t.startTime).sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())[0]?.startTime;
  const elapsedTotalSeconds = firstStartTime ? Math.floor((now.getTime() - new Date(firstStartTime).getTime()) / 1000) : 0;
  
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) return "00:00";
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getRelativeTime = (date: Date) => {
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  };

  const totalPossibleProgress = huntTeams.length * hunt.clues.length;
  let currentTotalProgress = 0;
  huntTeams.forEach(t => {
    currentTotalProgress += Math.min(t.currentClueIndex, hunt.clues.length);
  });
  
  const avgCompletionPct = totalPossibleProgress > 0 ? Math.round((currentTotalProgress / totalPossibleProgress) * 100) : 0;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const activeList = huntTeams.filter(t => t.status === "active");
    activeList.forEach(t => {
      sendMessage(t.id, "📢 " + broadcastText);
    });

    setActivityFeed(prev => [...prev, {
      id: `bc-${Date.now()}`,
      timestamp: new Date(),
      type: "broadcast",
      teamName: "Creator",
      teamColor: "#eab308",
      message: `Broadcast: ${broadcastText}`,
    }]);

    toast({
      title: "Broadcast Sent",
      description: `Sent to ${activeList.length} active teams.`,
    });

    setBroadcastText("");
  };

  const handleSendHint = (teamId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!hintText.trim()) return;

    sendMessage(teamId, "💡 Creator Hint: " + hintText);
    
    const t = huntTeams.find(t => t.id === teamId);
    if (t) {
      setActivityFeed(prev => [...prev, {
        id: `hint-${Date.now()}`,
        timestamp: new Date(),
        type: "hint_sent",
        teamName: t.name,
        teamColor: getTeamColor(t.id),
        message: `Hint sent to ${t.name}`,
      }]);
    }

    setHintText("");
    setActiveHintTeamId(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shadow-md z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800" onClick={() => setLocation("/dashboard/creator")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">{hunt.title}</h1>
          <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Active:</span>
            <span className="text-green-400">{activeTeamsCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Completed:</span>
            <span className="text-yellow-400">{completedTeamsCount}</span>
          </div>
          <div className="bg-gray-800 px-3 py-1 rounded-md text-gray-200 font-mono tracking-wider">
            {formatTime(elapsedTotalSeconds)}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border-b border-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Overall Hunt Progress</span>
            <span className="text-sm font-bold text-gray-300">{avgCompletionPct}% avg completion</span>
          </div>
          <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner mb-2">
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full"
              style={{ 
                width: `${avgCompletionPct}%`,
                backgroundColor: avgCompletionPct > 80 ? '#22c55e' : avgCompletionPct > 40 ? '#eab308' : '#3b82f6',
                boxShadow: '0 0 10px rgba(0,0,0,0.5) inset'
              }}
            />
          </div>
          <div className="relative h-4 w-full">
            {huntTeams.filter(t => t.status !== "lobby").map(team => {
              const pct = Math.min(team.currentClueIndex / hunt.clues.length * 100, 100);
              return (
                <div 
                  key={team.id}
                  className="absolute top-0 w-3 h-3 rounded-full border border-gray-900 shadow-sm transition-all duration-1000 z-10"
                  style={{ left: `calc(${pct}% - 6px)`, backgroundColor: getTeamColor(team.id) }}
                  title={`${team.name}: ${Math.round(pct)}%`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-[1600px] mx-auto w-full">
        
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {huntTeams.map(team => {
              const teamColor = getTeamColor(team.id);
              const progressPct = Math.min(team.currentClueIndex / hunt.clues.length * 100, 100);
              const isStuck = team.failedAttempts >= 3 && team.status === "active";
              const teamElapsedSeconds = team.startTime && team.status !== "complete" 
                ? Math.floor((now.getTime() - new Date(team.startTime).getTime()) / 1000)
                : team.totalTime || 0;

              return (
                <div key={team.id} className={`bg-gray-900 border ${isStuck ? 'border-red-500 animate-pulse ring-2 ring-red-500/50' : 'border-gray-800'} rounded-xl p-4 relative overflow-hidden flex flex-col shadow-lg`}>
                  {team.status === "complete" && (
                    <div className="absolute inset-0 bg-yellow-500/10 z-0 pointer-events-none" />
                  )}
                  
                  <div className="flex justify-between items-start mb-4 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />
                      <h3 className="font-bold text-gray-100">{team.name}</h3>
                    </div>
                    
                    {team.status === "lobby" && <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-800 text-gray-400">LOBBY</span>}
                    {team.status === "active" && !isStuck && <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 animate-pulse border border-green-500/30">ACTIVE</span>}
                    {team.status === "active" && isStuck && <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 animate-pulse border border-red-500/30">STUCK</span>}
                    {team.status === "complete" && <span className="text-[10px] font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1"><Trophy size={10} /> COMPLETE</span>}
                  </div>

                  <div className="flex justify-between items-end mb-4 z-10">
                    <div className="flex -space-x-2">
                      {team.members.map((m, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border border-gray-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: getAvatarColor(m.userId) }} title={m.name}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    {team.status !== "lobby" && (
                      <div className="text-gray-400 font-mono text-sm flex items-center gap-1">
                        ⏱ {formatTime(teamElapsedSeconds)}
                      </div>
                    )}
                  </div>

                  {team.status !== "lobby" && (
                    <div className="mt-auto space-y-2 z-10">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Clue {Math.min(team.currentClueIndex + 1, hunt.clues.length)} of {hunt.clues.length}</span>
                        <span>{Math.round(progressPct)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: teamColor }} />
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 h-8">
                        {team.failedAttempts > 0 && team.status === "active" ? (
                          <span className="text-xs text-red-400 flex items-center gap-1 font-medium bg-red-500/10 px-2 py-0.5 rounded">
                            <AlertTriangle size={12} /> {team.failedAttempts} fails
                          </span>
                        ) : <span />}
                        
                        {team.status === "active" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
                            onClick={() => setActiveHintTeamId(activeHintTeamId === team.id ? null : team.id)}
                          >
                            💬 Send Hint
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeHintTeamId === team.id && (
                    <div className="mt-3 pt-3 border-t border-gray-800 z-10">
                      <form onSubmit={(e) => handleSendHint(team.id, e)} className="flex gap-2">
                        <Input 
                          size={1}
                          className="h-8 text-xs bg-gray-950 border-gray-700 text-gray-200 placeholder:text-gray-600 focus-visible:ring-gray-700" 
                          placeholder="Type a hint..." 
                          value={hintText}
                          onChange={e => setHintText(e.target.value)}
                          autoFocus
                        />
                        <Button type="submit" size="sm" className="h-8 px-2 bg-gray-800 hover:bg-gray-700 text-gray-300">
                          <Send size={14} />
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col gap-4">
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[60vh] md:h-auto md:flex-1 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2 bg-gray-900/80">
              <Radio size={18} className="text-blue-400" />
              <h2 className="font-bold text-gray-200">Activity Feed</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
              <AnimatePresence initial={false}>
                {activityFeed.map((event) => {
                  let Icon = CheckCircle2;
                  let iconColor = "text-green-400";
                  let bgClass = "bg-green-500/10 border-green-500/20";
                  
                  if (event.type === "clue_failed") {
                    Icon = XCircle; iconColor = "text-red-400"; bgClass = "bg-red-500/10 border-red-500/20";
                  } else if (event.type === "hunt_complete") {
                    Icon = Trophy; iconColor = "text-yellow-400"; bgClass = "bg-yellow-500/10 border-yellow-500/20";
                  } else if (event.type === "team_joined") {
                    Icon = UserPlus; iconColor = "text-blue-400"; bgClass = "bg-blue-500/10 border-blue-500/20";
                  } else if (event.type === "hint_sent") {
                    Icon = Lightbulb; iconColor = "text-purple-400"; bgClass = "bg-purple-500/10 border-purple-500/20";
                  } else if (event.type === "broadcast") {
                    Icon = Megaphone; iconColor = "text-yellow-500"; bgClass = "bg-yellow-500/10 border-yellow-500/20";
                  }

                  return (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`p-3 rounded-lg border flex gap-3 ${bgClass}`}
                    >
                      <div className="mt-0.5"><Icon size={16} className={iconColor} /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold" style={{ color: event.teamColor }}>{event.teamName}</span>
                          <span className="text-[10px] text-gray-500">{getRelativeTime(event.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-300">{event.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={feedEndRef} className="h-1" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg shrink-0">
            <h3 className="font-bold text-gray-200 mb-3 flex items-center gap-2 text-sm">
              <Megaphone size={16} className="text-gray-400" />
              Broadcast to All Teams
            </h3>
            <form onSubmit={handleBroadcast} className="space-y-3">
              <Input 
                className="bg-gray-950 border-gray-800 text-gray-200 placeholder:text-gray-600 focus-visible:ring-gray-700" 
                placeholder="Message all active teams..." 
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value)}
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none" disabled={!broadcastText.trim() || activeTeamsCount === 0}>
                Send Broadcast
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}