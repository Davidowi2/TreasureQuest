import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Copy, Users, Play, X, Shield, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/context/AppContext";
import { ChatPanel } from "@/components/ChatPanel";

export default function TeamLobby() {
  const [, params] = useRoute("/team/:teamId/lobby");
  const [, setLocation] = useLocation();
  const { teams, setTeams, hunts, currentUser } = useAppContext();
  
  const [copied, setCopied] = useState(false);

  const teamId = params?.teamId;
  const team = teams.find(t => t.id === teamId);
  const hunt = team ? hunts.find(h => h.id === team.huntId) : null;

  // Poll to simulate member activity joining
  useEffect(() => {
    if (!team) return;
    
    const interval = setInterval(() => {
      setTeams(currentTeams => {
        return currentTeams.map(t => {
          if (t.id === teamId) {
            const newMembers = [...t.members];
            // Randomly toggle activity of a non-leader
            const nonLeaders = newMembers.filter(m => !m.isLeader && m.userId !== currentUser?.id);
            if (nonLeaders.length > 0) {
              const randomMember = nonLeaders[Math.floor(Math.random() * nonLeaders.length)];
              randomMember.isActive = Math.random() > 0.3; // 70% chance to be active
            }
            return { ...t, members: newMembers };
          }
          return t;
        });
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [teamId, setTeams, currentUser]);

  useEffect(() => {
    if (!currentUser || !team) return;
    const alreadyJoined = team.messages?.some(
      m => m.isSystem && m.text.includes(currentUser.name)
    );
    if (!alreadyJoined) {
      setTeams(prev => prev.map(t => t.id === teamId ? {
        ...t,
        messages: [...(t.messages || []), {
          id: `sys-${Date.now()}`,
          userId: "system",
          userName: "System",
          text: `${currentUser.name} joined the lobby`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        }]
      } : t));
    }
  }, []); // only on mount

  if (!team || !hunt || !currentUser) {
    return <div className="p-8 text-center">Loading or not found...</div>;
  }

  const currentUserMember = team.members.find(m => m.userId === currentUser.id);
  const isLeader = currentUserMember?.isLeader;
  const activeMembersCount = team.members.filter(m => m.isActive).length;
  const isSolo = hunt?.gameMode === "solo";
  const canStart = isLeader && (isSolo ? true : activeMembersCount >= 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    const updatedTeams = teams.map(t => {
      if (t.id === team.id) {
        return { ...t, status: "active" as const, startTime: new Date().toISOString() };
      }
      return t;
    });
    setTeams(updatedTeams);
    setLocation(`/game/${team.id}`);
  };

  const handleRemoveMember = (userId: string) => {
    const updatedTeams = teams.map(t => {
      if (t.id === team.id) {
        return { ...t, members: t.members.filter(m => m.userId !== userId) };
      }
      return t;
    });
    setTeams(updatedTeams);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-4rem)] flex flex-col">
      <Button variant="ghost" onClick={() => setLocation("/dashboard/player")} className="self-start mb-6 -ml-4 text-muted-foreground">
        <ArrowLeft className="mr-2" size={16} /> Dashboard
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
        <p className="text-xl text-muted-foreground">Preparing for: {hunt.title}</p>
      </div>

      {isSolo && (
        <div className="mb-4 flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-700 text-sm max-w-2xl mx-auto w-full">
          <User size={16} className="flex-shrink-0" />
          <span><strong>Solo Hunt</strong> — You're the only adventurer. Start whenever you're ready.</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 flex-grow">
        <div className="flex flex-col">
          <Card className="border-2 shadow-xl bg-card relative overflow-hidden mb-6">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Invite Code</CardTitle>
              <div className="flex justify-center items-center gap-4 mt-2">
                <div className="text-5xl font-mono font-bold tracking-widest bg-muted py-2 px-6 rounded-lg">
                  {team.inviteCode}
                </div>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-12 w-12 rounded-full">
                  {copied ? <span className="text-emerald-500 font-bold text-xs">OK!</span> : <Copy size={20} />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Share this code with your friends so they can join.</p>
            </CardHeader>
          </Card>

          <Card className="flex-grow">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Users className="text-primary" />
                <CardTitle>Team Roster</CardTitle>
              </div>
              <div className="text-sm font-medium">
                <span className="text-emerald-500">{activeMembersCount}</span> / {team.members.length} Active
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {team.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                          {member.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${member.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {member.name}
                          {member.userId === currentUser.id && <span className="text-xs text-muted-foreground font-normal">(You)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {member.isLeader && <Shield size={12} className="text-primary" />}
                          {member.isLeader ? 'Leader' : member.isActive ? 'Ready' : 'Waiting...'}
                        </div>
                      </div>
                    </div>
                    
                    {isLeader && !member.isLeader && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(member.userId)}>
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                {team.members.length === 1 && !isSolo && (
                  <div className="p-8 text-center text-muted-foreground italic">
                    Waiting for others to join...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            {isLeader ? (
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold shadow-lg" 
                disabled={!canStart}
                onClick={handleStartGame}
              >
                {canStart ? (
                  <><Play className="mr-2" /> {isSolo ? "Begin Solo Hunt" : "Start Adventure"}</>
                ) : (
                  isSolo ? "Ready to start..." : "Waiting for at least 1 other active player..."
                )}
              </Button>
            ) : (
              <div className="w-full h-14 bg-muted text-muted-foreground rounded-lg flex items-center justify-center font-medium border border-dashed">
                <div className="flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Waiting for leader to start...
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-[500px] md:h-auto">
          <ChatPanel teamId={team.id} />
        </div>
      </div>
    </div>
  );
}
