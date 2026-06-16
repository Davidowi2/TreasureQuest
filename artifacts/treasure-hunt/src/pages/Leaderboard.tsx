import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, MapPin, Award, ChevronLeft, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAppContext } from "@/context/AppContext";
import { fetchAPI } from "@/lib/api";

type LeaderboardEntry = {
  id: string;
  teamName: string;
  gameStatus: "active" | "paused" | "completed";
  cluesFound: number;
  totalClues: number;
  lastActiveTime: string | null;
  rank: number;
};

export default function Leaderboard() {
  const { huntId } = useParams<{ huntId?: string }>();
  const { hunts } = useAppContext();
  const [selectedHuntId, setSelectedHuntId] = useState<string>(huntId || "");

  // Fetch leaderboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", selectedHuntId],
    queryFn: async () => {
      if (!selectedHuntId) return null;
      const res = await fetchAPI<{ leaderboard: LeaderboardEntry[] }>(
        `/api/v1/leaderboards/${selectedHuntId}`
      );
      return res.leaderboard;
    },
    enabled: !!selectedHuntId,
  });

  const publishedHunts = hunts.filter((h) => h.status === "published");

  // Split into top 3 and rest
  const topThree = useMemo(() => {
    if (!data) return [];
    return data.slice(0, 3);
  }, [data]);

  const restOfTeams = useMemo(() => {
    if (!data) return [];
    return data.slice(3);
  }, [data]);

  const getPodiumPlacement = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          accent: "from-yellow-400 to-yellow-600",
          textColor: "text-yellow-900",
          bg: "bg-yellow-50 border-yellow-200",
        };
      case 2:
        return {
          accent: "from-slate-400 to-slate-600",
          textColor: "text-slate-900",
          bg: "bg-slate-50 border-slate-200",
        };
      case 3:
        return {
          accent: "from-amber-600 to-amber-800",
          textColor: "text-amber-900",
          bg: "bg-amber-50 border-amber-200",
        };
      default:
        return {
          accent: "from-gray-400 to-gray-600",
          textColor: "text-gray-900",
          bg: "bg-gray-50 border-gray-200",
        };
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: LeaderboardEntry["gameStatus"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">Completed</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">Active</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Paused</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button variant="ghost" className="p-0 h-auto mr-2">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1">Live Leaderboard</h1>
            <p className="text-muted-foreground text-base">
              Real-time team rankings and progress
            </p>
          </div>
        </div>

        {/* Hunt Selector */}
        <div className="w-full max-w-md">
          <Select
            value={selectedHuntId}
            onValueChange={(value) => setSelectedHuntId(value)}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select a hunt to view" />
            </SelectTrigger>
            <SelectContent>
              {publishedHunts.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load leaderboard. Please try again.</AlertDescription>
        </Alert>
      )}

      {/* Leaderboard Content */}
      {!isLoading && !error && selectedHuntId && data && (
        <>
          {/* No Teams State */}
          {data.length === 0 && (
            <div className="text-center py-24 bg-muted/30 rounded-3xl border border-dashed">
              <Trophy size={64} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Be the first team to start this hunt and claim the top spot!
              </p>
            </div>
          )}

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Top Teams
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topThree.map((team, index) => {
                  const placement = getPodiumPlacement(team.rank);
                  const isCenter = index === 0;
                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <Card
                        className={`h-full border-2 ${placement.bg} ${
                          isCenter ? "md:-mt-8" : ""
                        }`}
                      >
                        <CardHeader className="text-center pb-2">
                          <div
                            className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${placement.accent} mb-2 shadow-xl`}
                          >
                            <span className="text-2xl font-extrabold text-white">{team.rank}</span>
                          </div>
                          <CardTitle className="text-xl md:text-2xl">{team.teamName}</CardTitle>
                          <CardDescription className="flex items-center justify-center gap-2">
                            {team.totalClues > 0 ? (
                              <span className="font-medium">
                                {team.cluesFound}/{team.totalClues} Clues
                              </span>
                            ) : (
                              <span className="font-medium">Getting Started</span>
                            )}
                            {getStatusBadge(team.gameStatus)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                          <div className="flex flex-col items-center">
                            {team.totalClues > 0 && (
                              <div className="w-full max-w-xs mb-4">
                                <Progress
                                  value={(team.cluesFound / team.totalClues) * 100}
                                  className="h-3"
                                />
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              Last check-in: {formatTime(team.lastActiveTime)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rest of the Teams Data Table */}
          {restOfTeams.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">All Teams</h2>
              <Card className="border shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center font-semibold">Rank</TableHead>
                        <TableHead className="font-semibold">Team</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Status</TableHead>
                        <TableHead className="font-semibold">Progress</TableHead>
                        <TableHead className="font-semibold text-right hidden md:table-cell">Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restOfTeams.map((team, i) => (
                        <TableRow
                          key={team.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="text-center font-bold">
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              {team.rank}
                            </motion.span>
                          </TableCell>
                          <TableCell className="font-medium">
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 + 0.02 }}
                            >
                              {team.teamName}
                            </motion.span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {getStatusBadge(team.gameStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Progress
                                value={team.totalClues > 0 ? (team.cluesFound / team.totalClues) * 100 : 0}
                                className="w-24 md:w-32"
                              />
                              <span className="text-sm text-muted-foreground font-medium">
                                {team.cluesFound}/{team.totalClues}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground hidden md:table-cell">
                            {formatTime(team.lastActiveTime)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
