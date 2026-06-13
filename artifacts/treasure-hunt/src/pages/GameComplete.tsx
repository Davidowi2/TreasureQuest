import { useRoute, Link, useLocation } from "wouter";
import { Trophy, Clock, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { ConfettiEffect } from "@/components/ConfettiEffect";

export default function GameComplete() {
  const [, params] = useRoute("/game/:teamId/complete");
  const [, setLocation] = useLocation();
  const { teams, hunts } = useAppContext();

  const teamId = params?.teamId;
  const team = teams.find(t => t.id === teamId);
  const hunt = team ? hunts.find(h => h.id === team.huntId) : null;

  if (!team || !hunt) {
    return <div className="p-8 text-center">Not found.</div>;
  }

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Mock leaderboard - get all completed teams for this hunt, sort by time
  const leaderboard = teams
    .filter(t => t.huntId === hunt.id && t.status === "complete" && t.totalTime)
    .sort((a, b) => (a.totalTime || 999999) - (b.totalTime || 999999));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-primary/10 to-background flex flex-col">
      <ConfettiEffect />
      
      <div className="container mx-auto px-4 py-12 max-w-md flex-grow flex flex-col items-center justify-center text-center">
        
        <div className="w-32 h-32 bg-gradient-to-tr from-accent to-yellow-300 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-accent/40 border-4 border-white z-10">
          <Trophy size={64} className="text-accent-foreground" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">Hunt Complete!</h1>
        <p className="text-xl text-muted-foreground mb-10">
          Team <span className="font-bold text-primary">{team.name}</span> conquered "{hunt.title}"
        </p>

        <div className="grid grid-cols-2 gap-4 w-full mb-10">
          <Card className="bg-background/80 backdrop-blur-sm border-border">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Clock className="text-primary mb-2" size={28} />
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Time</p>
              <p className="text-2xl font-bold">{formatTime(team.totalTime)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-background/80 backdrop-blur-sm border-border">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Target className="text-secondary mb-2" size={28} />
              <p className="text-sm font-medium text-muted-foreground mb-1">Failed Attempts</p>
              <p className="text-2xl font-bold">{team.failedAttempts}</p>
            </CardContent>
          </Card>
        </div>

        {leaderboard.length > 0 && (
          <div className="w-full bg-card rounded-2xl border p-6 mb-8 text-left shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-accent" /> Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map((t, i) => (
                <div key={t.id} className={`flex justify-between items-center p-3 rounded-lg ${t.id === team.id ? 'bg-primary/10 border border-primary/20 font-bold' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-center ${i === 0 ? 'text-accent' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                      #{i + 1}
                    </span>
                    <span>{t.name}</span>
                  </div>
                  <span>{formatTime(t.totalTime)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full space-y-3">
          <Button size="lg" className="w-full h-14 text-lg" onClick={() => setLocation("/hunts")}>
            Browse More Hunts
          </Button>
          <Button variant="outline" size="lg" className="w-full h-14 bg-transparent" onClick={() => setLocation("/dashboard/player")}>
            Back to Dashboard
          </Button>
        </div>
        
      </div>
    </div>
  );
}
