import { Link, useLocation } from "wouter";
import { Play, Trophy, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";

export default function PlayerDashboard() {
  const { teams, hunts, currentUser } = useAppContext();
  const [, setLocation] = useLocation();

  if (!currentUser || (currentUser.role !== "player" && currentUser.role !== "both")) {
    setLocation("/");
    return null;
  }

  const myTeams = teams.filter(t => t.members.some(m => m.userId === currentUser.id));
  
  const activeTeams = myTeams.filter(t => t.status === "active" || t.status === "lobby");
  const completedTeams = myTeams.filter(t => t.status === "complete");

  const TeamCard = ({ team }: { team: any }) => {
    const hunt = hunts.find(h => h.id === team.huntId);
    if (!hunt) return null;

    const isActive = team.status === "active";
    const isLobby = team.status === "lobby";

    return (
      <Card className={`overflow-hidden transition-all hover:shadow-md border-border ${team.status === 'complete' ? 'opacity-80 bg-muted/20' : 'bg-card'}`}>
        <CardContent className="p-0">
          <div className={`h-2 w-full ${isActive ? 'bg-primary' : isLobby ? 'bg-secondary' : 'bg-emerald-500'}`} />
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{team.name}</h3>
                <p className="text-sm text-muted-foreground font-medium">Playing: {hunt.title}</p>
              </div>
              <Badge variant={isActive ? 'default' : isLobby ? 'secondary' : 'outline'} className="capitalize">
                {team.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users size={16} />
                {team.members.length} Members
              </div>
              {team.status === 'complete' ? (
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <Trophy size={16} /> Completed
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Clue {team.currentClueIndex + 1} / {hunt.clues.length}
                </div>
              )}
            </div>
            
            {(isActive || isLobby) && (
              <Button 
                className="w-full font-semibold" 
                variant={isLobby ? "secondary" : "default"}
                onClick={() => setLocation(isLobby ? `/team/${team.id}/lobby` : `/game/${team.id}`)}
              >
                {isLobby ? "Go to Lobby" : (
                  <><Play size={16} className="mr-2" /> Resume Game</>
                )}
              </Button>
            )}
            {team.status === 'complete' && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation(`/game/${team.id}/complete`)}
              >
                View Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
          <p className="text-muted-foreground">Track your ongoing adventures and past victories.</p>
        </div>
        <Link href="/hunts">
          <Button size="lg" className="shadow-md">
            Find New Hunt
          </Button>
        </Link>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Currently Playing
            <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full font-bold">{activeTeams.length}</span>
          </h2>
          {activeTeams.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {activeTeams.map(team => <TeamCard key={team.id} team={team} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground mb-4">You aren't in any active hunts right now.</p>
              <Link href="/hunts">
                <Button variant="outline">Browse Hunts</Button>
              </Link>
            </div>
          )}
        </section>

        {completedTeams.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
              Past Victories
              <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">{completedTeams.length}</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTeams.map(team => <TeamCard key={team.id} team={team} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
