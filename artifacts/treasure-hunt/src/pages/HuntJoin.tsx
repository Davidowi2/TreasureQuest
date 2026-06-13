import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, MapPin, Users, Key, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext, Team } from "@/context/AppContext";
import { DifficultyBadge } from "@/components/DifficultyBadge";

export default function HuntJoin() {
  const [, params] = useRoute("/hunts/:id/join");
  const [, setLocation] = useLocation();
  const { hunts, teams, setTeams, currentUser } = useAppContext();
  
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const huntId = params?.id;
  const hunt = hunts.find(h => h.id === huntId);

  if (!hunt) {
    return <div className="p-8 text-center">Hunt not found.</div>;
  }

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setLocation("/login");
      return;
    }
    if (!teamName) {
      setError("Please enter a team name.");
      return;
    }

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTeam: Team = {
      id: `t${Date.now()}`,
      huntId: hunt.id,
      name: teamName,
      inviteCode: newCode,
      status: "lobby",
      currentClueIndex: 0,
      failedAttempts: 0,
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          isActive: true,
          isLeader: true
        }
      ]
    };

    setTeams([...teams, newTeam]);
    setLocation(`/team/${newTeam.id}/lobby`);
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setLocation("/login");
      return;
    }
    if (!inviteCode) {
      setError("Please enter an invite code.");
      return;
    }

    const team = teams.find(t => t.inviteCode.toUpperCase() === inviteCode.toUpperCase() && t.huntId === hunt.id);
    
    if (!team) {
      setError("Invalid invite code for this hunt.");
      return;
    }

    // Check if user is already in team
    if (!team.members.some(m => m.userId === currentUser.id)) {
      const updatedTeams = teams.map(t => {
        if (t.id === team.id) {
          return {
            ...t,
            members: [...t.members, { userId: currentUser.id, name: currentUser.name, isActive: true, isLeader: false }]
          };
        }
        return t;
      });
      setTeams(updatedTeams);
    }
    
    setLocation(`/team/${team.id}/lobby`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-4rem)]">
      <Button variant="ghost" onClick={() => setLocation("/hunts")} className="mb-6 -ml-4 text-muted-foreground">
        <ArrowLeft className="mr-2" size={16} /> Back to Hunts
      </Button>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex gap-2 mb-3">
              <DifficultyBadge difficulty={hunt.difficulty} />
              <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <MapPin size={12} className="mr-1" />
                {hunt.locationTag}
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">{hunt.title}</h1>
            <p className="text-muted-foreground mb-6 text-lg">{hunt.description}</p>
            
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Creator</span>
                <span className="font-medium">{hunt.creatorName}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Clues</span>
                <span className="font-medium">{hunt.clues.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <Card className="border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b pb-6">
              <CardTitle className="text-2xl">Join the Adventure</CardTitle>
              <CardDescription>
                Create a new team to lead, or join an existing one.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-8">
                {/* Create Team Form */}
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <Users size={20} />
                    <h3>Create a New Team</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="teamName" 
                        placeholder="e.g. The Night Owls" 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="flex-grow"
                      />
                      <Button type="submit" className="whitespace-nowrap">
                        <Play size={16} className="mr-2" /> Create
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-semibold">Or</span>
                  </div>
                </div>

                {/* Join Team Form */}
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-secondary-foreground font-semibold">
                    <Key size={20} className="text-secondary" />
                    <h3>Join Existing Team</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="inviteCode" 
                        placeholder="6-character code" 
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="flex-grow font-mono uppercase tracking-wider"
                        maxLength={6}
                      />
                      <Button type="submit" variant="secondary" className="whitespace-nowrap">
                        Join Team
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
