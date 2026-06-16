import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Clock, AlertTriangle, Calendar, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchAPI } from "@/lib/api";

type LeaderboardEntry = {
  id: string;
  teamName: string;
  gameStatus: "active" | "completed";
  currentStep: number;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  hasFinished: boolean;
  rank: number;
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="text-center mb-12 mt-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 bg-accent/10 rounded-full text-accent mb-4"
        >
          <Trophy size={48} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Leaderboard</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {selectedHuntId
            ? "Check out the teams racing through this hunt!"
            : "Select a hunt to view the leaderboard!"}
        </p>

        <div className="flex justify-center gap-8 mt-8 text-sm font-medium text-muted-foreground">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">{publishedHunts.length}</span> Hunts
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex-1">
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
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load leaderboard. Please try again.</AlertDescription>
        </Alert>
      )}

      {/* Leaderboard Table */}
      {data && data.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm mb-16">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Rank</th>
                  <th className="px-6 py-4 font-semibold">Team</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Status</th>
                  <th className="px-6 py-4 font-semibold hidden sm:table-cell">Current Step</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                </tr>
              </thead>
              <motion.tbody
                className="divide-y"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {data.map((entry, idx) => (
                  <motion.tr
                    key={entry.id}
                    variants={itemVariants}
                    className="hover:bg-muted/30 transition-colors bg-card"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm ${
                          idx === 0
                            ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white"
                            : idx === 1
                            ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                            : idx === 2
                            ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx === 0 ? <Medal size={16} /> : idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-base">{entry.teamName}</td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          entry.hasFinished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {entry.hasFinished ? "Completed" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      Step {entry.currentStep}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-base">
                      {formatTime(entry.durationSeconds)}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !error && selectedHuntId && data && data.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed mb-16">
          <Trophy size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Be the first team to start this hunt!
          </p>
        </div>
      )}
    </div>
  );
}
