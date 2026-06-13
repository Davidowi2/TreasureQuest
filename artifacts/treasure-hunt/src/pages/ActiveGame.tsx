import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, AlertCircle, CheckCircle2, Unlock, ChevronRight, BookOpen, Image as ImageIcon, ZoomIn, Music, Play, Pause, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { ChatPanel } from "@/components/ChatPanel";

function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const DURATION = 42;
  const bars = [3,6,4,8,5,9,3,7,6,4,8,5,3,7,9,4,6,8,5,3];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentTime < DURATION) {
      interval = setInterval(() => setCurrentTime(t => t + 1), 1000);
    } else if (currentTime >= DURATION) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime]);

  const togglePlay = () => {
    if (currentTime >= DURATION) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 flex flex-col items-center shadow-inner relative overflow-hidden">
      <div className="absolute top-4 left-4 bg-slate-800/80 px-2 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm z-10 text-xs text-slate-300 font-medium">
        <Music size={12} />
        <span>Audio Clue</span>
      </div>
      <Music size={32} className="text-slate-400 mb-6 mt-4" />
      
      <div className="flex items-end justify-center gap-1 h-16 mb-8 w-full">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-primary rounded-full origin-bottom"
            initial={{ height: height * 4 }}
            animate={isPlaying ? { height: [height * 4, height * 6, height * 3, height * 5, height * 4] } : { height: height * 4 }}
            transition={{
              duration: 1.5,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
              delay: i * 0.05
            }}
          />
        ))}
      </div>

      <Button
        variant="default"
        size="icon"
        className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground mb-4 shadow-lg shadow-primary/20"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
      </Button>

      <div className="text-sm font-mono text-slate-400 mb-1">
        {formatTime(currentTime)} / {formatTime(DURATION)}
      </div>
      <div className="text-[10px] text-slate-600">Mock audio — no real file</div>
    </div>
  );
}

export default function ActiveGame() {
  const [, params] = useRoute("/game/:teamId");
  const [, setLocation] = useLocation();
  const { teams, setTeams, hunts } = useAppContext();
  
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failureMsg, setFailureMsg] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [lastSeenMsgCount, setLastSeenMsgCount] = useState(0);

  const teamId = params?.teamId;
  const team = teams.find(t => t.id === teamId);
  const hunt = team ? hunts.find(h => h.id === team.huntId) : null;
  const { currentUser } = useAppContext();

  useEffect(() => {
    if (chatOpen && team) {
      setLastSeenMsgCount(team.messages.length);
    }
  }, [chatOpen, team?.messages.length]);

  useEffect(() => {
    if (!team || team.members.length < 2) return;
    const timer = setTimeout(() => {
      const teammate = team.members.find(m => m.userId !== currentUser?.id);
      if (!teammate) return;
      setTeams(prev => prev.map(t => t.id === teamId ? {
        ...t,
        messages: [...t.messages, {
          id: `auto-${Date.now()}`,
          userId: teammate.userId,
          userName: teammate.name,
          text: "Any ideas on this clue?",
          timestamp: new Date().toISOString(),
        }]
      } : t));
    }, 8000);
    return () => clearTimeout(timer);
  }, [teamId]);

  const unreadCount = team
    ? team.messages.filter(m => !m.isSystem && m.userId !== currentUser?.id).length - lastSeenMsgCount
    : 0;
  const safeUnread = Math.max(0, unreadCount);

  if (!team || !hunt || team.status !== "active") {
    // If completed, redirect
    if (team?.status === "complete") {
      setLocation(`/game/${team.id}/complete`);
      return null;
    }
    return <div className="p-8 text-center">Game not found or not active.</div>;
  }

  const currentClue = hunt.clues[team.currentClueIndex];
  const progressPercent = (team.currentClueIndex / hunt.clues.length) * 100;
  const isLastClue = team.currentClueIndex === hunt.clues.length - 1;

  const handleSubmitPhoto = () => {
    setVerifying(true);
    setFailureMsg("");
    setShowUnlock(false);

    setTimeout(() => {
      setVerifying(false);
      
      // Mock logic: 70% chance of success, 100% on 3rd attempt
      const willSucceed = team.failedAttempts >= 2 || Math.random() > 0.3;
      
      if (willSucceed) {
        setSuccess(true);
      } else {
        const newFails = team.failedAttempts + 1;
        setFailureMsg(`That doesn't look quite right. (Attempt ${newFails})`);
        
        // Update team failed attempts
        setTeams(teams.map(t => t.id === team.id ? { ...t, failedAttempts: newFails } : t));
        
        if (newFails >= 3) {
          setShowUnlock(true);
        }
      }
    }, 2000);
  };

  const handleNextClue = () => {
    setSuccess(false);
    
    if (isLastClue) {
      // Complete game
      const endTime = new Date();
      const startTime = new Date(team.startTime!);
      const totalTimeSecs = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      setTeams(teams.map(t => t.id === team.id ? { 
        ...t, 
        status: "complete", 
        endTime: endTime.toISOString(), 
        completedAt: endTime.toISOString(),
        totalTime: totalTimeSecs
      } : t));
      
      setLocation(`/game/${team.id}/complete`);
    } else {
      // Next clue
      setTeams(teams.map(t => t.id === team.id ? { 
        ...t, 
        currentClueIndex: t.currentClueIndex + 1,
        failedAttempts: 0 // reset fails for new clue
      } : t));
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-muted/20">
      {success && <ConfettiEffect />}
      
      {imageZoomed && currentClue.clueType === "image" && currentClue.mediaUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImageZoomed(false)}
        >
          <img 
            src={currentClue.mediaUrl} 
            alt="Clue zoomed" 
            className="max-w-full max-h-full object-contain rounded-md"
          />
        </div>
      )}
      
      {/* Header bar */}
      <div className="bg-background border-b px-4 py-3 sticky top-16 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin size={14} /> {hunt.locationTag}
            </span>
            <span className="text-primary font-bold">
              Clue {team.currentClueIndex + 1} of {hunt.clues.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md flex flex-col">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div 
              key={`clue-${team.currentClueIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex flex-col justify-center"
            >
              <Card className="border-2 border-primary/20 shadow-xl overflow-hidden mb-6 relative">
                
                {currentClue.clueType === "text" && (
                  <div className="bg-[#fcf8f2] dark:bg-slate-900 p-8 text-center min-h-[240px] flex flex-col items-center justify-center relative">
                    <BookOpen className="absolute top-4 left-4 text-amber-900/20 dark:text-amber-100/10" size={24} />
                    <span className="absolute -top-4 -left-2 text-8xl text-amber-900/10 dark:text-amber-100/5 font-serif select-none pointer-events-none">"</span>
                    <h2 className="text-2xl font-bold leading-relaxed text-amber-950 dark:text-amber-50 font-serif italic relative z-10">
                      "{currentClue.hint}"
                    </h2>
                  </div>
                )}

                {currentClue.clueType === "image" && (
                  <div className="relative group cursor-zoom-in" onClick={() => setImageZoomed(true)}>
                    <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm z-10 text-xs text-white font-medium">
                      <ImageIcon size={12} />
                      <span>Image Clue</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 p-1.5 rounded-md backdrop-blur-sm z-10 text-white/80 group-hover:text-white transition-colors">
                      <ZoomIn size={16} />
                    </div>
                    <img 
                      src={currentClue.mediaUrl || "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80"} 
                      alt="Clue" 
                      className="w-full h-[280px] object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                      <p className="text-white font-medium text-center text-sm">Tap to zoom</p>
                    </div>
                  </div>
                )}

                {currentClue.clueType === "audio" && (
                  <AudioPlayer />
                )}
                
                {showUnlock && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t bg-accent/10 p-4"
                  >
                    <div className="flex gap-3 text-accent-foreground">
                      <Unlock className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm mb-1">Direct Hint Unlocked</p>
                        <p className="text-sm">{currentClue.hintUnlockText}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>

              {failureMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="flex-shrink-0" />
                  <p className="font-medium text-sm pt-0.5">{failureMsg}</p>
                </motion.div>
              )}

              <div className="mt-auto pt-6">
                <Button 
                  size="lg" 
                  className={`w-full h-16 text-lg rounded-2xl shadow-lg transition-all ${verifying ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                  onClick={handleSubmitPhoto}
                  disabled={verifying}
                >
                  {verifying ? (
                    <span className="flex items-center gap-2 animate-pulse">
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Camera size={24} /> Submit Photo Solution
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-grow flex flex-col items-center justify-center text-center space-y-6"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-inner"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              
              <h2 className="text-3xl font-bold">Nailed it!</h2>
              <p className="text-muted-foreground text-lg max-w-xs">
                Perfect match. Your team is one step closer to the end.
              </p>

              <div className="w-full pt-8">
                <Button size="lg" className="w-full h-16 text-lg rounded-2xl shadow-lg" onClick={handleNextClue}>
                  {isLastClue ? "Complete Hunt" : "Reveal Next Clue"} <ChevronRight className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground flex-shrink-0">
              <span className="font-semibold text-sm flex items-center gap-2">
                <MessageCircle size={16} /> Team Chat
              </span>
              <button onClick={() => setChatOpen(false)} className="hover:opacity-70">
                <X size={16} />
              </button>
            </div>
            <div className="flex-grow min-h-0 overflow-hidden">
              <ChatPanel teamId={teamId!} compact={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 relative">
        <button
          onClick={() => setChatOpen(prev => !prev)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle size={24} />
          {!chatOpen && safeUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
              {safeUnread > 9 ? "9+" : safeUnread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
