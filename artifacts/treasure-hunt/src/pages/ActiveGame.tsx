import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, AlertCircle, CheckCircle2, Unlock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { ConfettiEffect } from "@/components/ConfettiEffect";

export default function ActiveGame() {
  const [, params] = useRoute("/game/:teamId");
  const [, setLocation] = useLocation();
  const { teams, setTeams, hunts } = useAppContext();
  
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failureMsg, setFailureMsg] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);

  const teamId = params?.teamId;
  const team = teams.find(t => t.id === teamId);
  const hunt = team ? hunts.find(h => h.id === team.huntId) : null;

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
              <Card className="border-2 border-primary/20 shadow-xl overflow-hidden mb-6">
                <div className="bg-primary/5 p-8 text-center min-h-48 flex items-center justify-center">
                  <h2 className="text-2xl font-bold leading-relaxed text-foreground">
                    "{currentClue.hint}"
                  </h2>
                </div>
                
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
    </div>
  );
}
