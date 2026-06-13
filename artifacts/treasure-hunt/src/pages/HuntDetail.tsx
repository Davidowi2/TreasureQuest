import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, Star, Users, TrendingUp, Clock, List, Lock, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/context/AppContext";
import { HuntTypeBadge } from "@/components/HuntTypeBadge";
import { DifficultyBadge } from "@/components/DifficultyBadge";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function HuntDetail() {
  const [, params] = useRoute("/hunts/:id");
  const { hunts, teams, currentUser } = useAppContext();
  
  const huntId = params?.id;
  const hunt = hunts.find(h => h.id === huntId);

  if (!hunt) {
    return <div className="p-8 text-center">Hunt not found.</div>;
  }

  const leaderboard = teams
    .filter(t => t.huntId === hunt.id && t.status === "complete" && t.totalTime)
    .sort((a, b) => (a.totalTime || 999999) - (b.totalTime || 999999));

  const getTypeExplanation = (type: string) => {
    switch(type) {
      case "photography": return "Snap photos matching each clue. Your lens is your guide. Perfect for visual thinkers and explorers.";
      case "riddle": return "Solve cryptic clues and puzzles. Think carefully — every word is a hint. Best for puzzle lovers.";
      case "trivia": return "Answer questions about the world around you. Knowledge is your compass. Great for teams who love facts.";
      case "exploration": return "Navigate to real locations and check in. Your legs are your superpower. Ideal for adventurers.";
      default: return "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-4rem)]">
      <Link href="/hunts">
        <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2" size={16} /> Back to Hunts
        </Button>
      </Link>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <HuntTypeBadge type={hunt.huntType} className="text-sm px-3 py-1" />
          <DifficultyBadge difficulty={hunt.difficulty} />
          <div className="flex items-center text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            <MapPin size={14} className="mr-1" />
            {hunt.locationTag}
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{hunt.title}</h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {hunt.creatorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Created by</span>
              <span className="font-semibold">{hunt.creatorName}</span>
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          
          {hunt.ratingCount > 0 ? (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs mb-0.5">Rating</span>
              <div className="flex items-center gap-1 font-semibold">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span>{hunt.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">({hunt.ratingCount} reviews)</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs mb-0.5">Rating</span>
              <span className="font-semibold text-muted-foreground">New Hunt</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg"><Users size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Players</p>
              <p className="text-xl font-bold">{hunt.totalPlayers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><TrendingUp size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-xl font-bold">{hunt.completionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><Clock size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-xl font-bold">{hunt.estimatedDuration}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 text-violet-500 rounded-lg"><List size={20} /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clues</p>
              <p className="text-xl font-bold">{hunt.clues.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">About This Hunt</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {hunt.description}
            </p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Hunt Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Team Size</span>
                  <p className="font-semibold">{hunt.minTeamSize} to {hunt.maxTeamSize} players</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Time Limit</span>
                  <p className="font-semibold">{hunt.timeLimit ? `${hunt.timeLimit} minutes` : "No time limit"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Difficulty</span>
                  <p className="font-semibold capitalize">{hunt.difficulty}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Shuffle Mode</span>
                  <p className="font-semibold">{hunt.isShuffled ? "On (Clues appear in random order)" : "Off (Sequential clues)"}</p>
                </div>
              </div>
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  What to expect: <span className="capitalize">{hunt.huntType}</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  {getTypeExplanation(hunt.huntType)}
                </p>
              </div>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-2xl font-bold mb-4">Clue Preview</h2>
            <div className="space-y-3">
              {hunt.clues.length > 0 && (
                <div className="p-4 rounded-lg border bg-card flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-lg">{hunt.clues[0].hint}</p>
                    <p className="text-sm text-muted-foreground mt-1">First clue to get you started.</p>
                  </div>
                </div>
              )}
              {hunt.clues.length > 1 && (
                <div className="p-4 rounded-lg border border-dashed bg-muted/30 flex items-center justify-center text-muted-foreground h-24">
                  <div className="flex items-center gap-2">
                    <Lock size={18} />
                    <span className="font-medium">Join to unlock {hunt.clues.length - 1} more clues</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-primary/20 shadow-lg shadow-primary/5">
              <CardContent className="p-6">
                <div className="mb-6 flex justify-center">
                  <HuntTypeBadge type={hunt.huntType} className="text-base px-4 py-2" />
                </div>
                
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Players needed</span>
                    <span className="font-semibold">{hunt.minTeamSize}-{hunt.maxTeamSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time limit</span>
                    <span className="font-semibold">{hunt.timeLimit ? `${hunt.timeLimit} min` : "None"}</span>
                  </div>
                </div>

                {currentUser ? (
                  <Link href={`/hunts/${hunt.id}/join`}>
                    <Button size="lg" className="w-full text-lg h-14">
                      <Play className="mr-2" size={20} /> Join This Hunt
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="w-full text-lg h-14">
                      Sign up to join
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {leaderboard.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy size={18} className="text-accent" /> Top Teams
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaderboard.slice(0, 3).map((team, idx) => (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`}>
                          #{idx + 1}
                        </span>
                        <span className="font-medium truncate">{team.name}</span>
                      </div>
                      <span className="font-mono bg-background px-2 py-1 rounded text-xs border">
                        {formatTime(team.totalTime!)}
                      </span>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <a href="#leaderboard" className="text-xs text-primary hover:underline font-medium">View full leaderboard</a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Full Leaderboard Section */}
      <section id="leaderboard" className="pt-8 border-t">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Trophy className="text-accent" /> Hunt Leaderboard
            </h2>
            <p className="text-muted-foreground">All teams that have completed this hunt.</p>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Rank</th>
                    <th className="px-6 py-4 font-semibold">Team</th>
                    <th className="px-6 py-4 font-semibold">Members</th>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold">Mistakes</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaderboard.map((team, idx) => (
                    <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          idx === 1 ? 'bg-slate-100 text-slate-700' : 
                          idx === 2 ? 'bg-amber-100 text-amber-800' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{team.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 3).map(m => (
                            <Avatar key={m.userId} className="w-8 h-8 border-2 border-background">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {m.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {team.members.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-[10px] font-medium z-10 relative">
                              +{team.members.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        {formatTime(team.totalTime!)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.failedAttempts === 0 ? 'bg-emerald-100 text-emerald-700' : 
                          team.failedAttempts > 3 ? 'bg-destructive/10 text-destructive' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {team.failedAttempts}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {team.completedAt ? new Date(team.completedAt).toLocaleDateString() : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
            <Trophy size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No completions yet</h3>
            <p className="text-muted-foreground mb-4">Be the first team to conquer this hunt!</p>
            <Link href={`/hunts/${hunt.id}/join`}>
              <Button>Join Now</Button>
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
