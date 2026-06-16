import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowLeft, Trophy, CheckCircle2, Clock } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { motion } from "framer-motion";

export default function HostLobby() {
  const [, params] = useRoute("/hunt/:huntId/lobby");
  const huntId = params?.huntId;
  const [, setLocation] = useLocation();
  const { currentUser, teams, setTeams } = useAppContext();
  const [copied, setCopied] = useState(false);

  const { data: hunt, isLoading } = useQuery({
    queryKey: ["hunt", huntId],
    queryFn: async () => fetchAPI<any>(`/api/v1/hunts/${huntId}`),
    enabled: !!huntId,
  });

  const huntTeams = teams.filter((t: any) => t.huntId === huntId);

  const generatePin = () => {
    if (!huntId) return "";
    return huntId.toUpperCase().replace(/-/g, "").slice(0, 8);
  };

  const pin = generatePin();

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy pin:", err);
    }
  };

  // Simulate real-time team joins for now
  useEffect(() => {
    if (!huntId) return;
    const interval = setInterval(() => {
      const teamNames = ["Alpha Squad", "Treasure Hunters", "Clue Crackers", "Map Masters"];
      const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33"];
      const randomTeam = teamNames[Math.floor(Math.random() * teamNames.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setTeams((prev: any[]) => {
        if (prev.some((t) => t.name === randomTeam)) return prev;
        return [...prev, {
          id: `team-${Date.now()}`,
          name: randomTeam,
          huntId,
          status: "lobby",
          currentClueIndex: 0,
          failedAttempts: 0,
          color: randomColor,
          members: [],
          startTime: null,
          totalTime: 0,
          completedAt: null,
        }];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [huntId, setTeams]);

  if (!currentUser) {
    setLocation("/login");
    return null;
  }

  if (isLoading || !hunt) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-4rem)]">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/creator">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{hunt.title}</h1>
          <p className="text-muted-foreground">Waiting for teams to join...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PIN & QR Code */}
        <Card className="p-6 lg:p-8 shadow-xl border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl lg:text-3xl">Share Your Game PIN</CardTitle>
            <CardDescription>Share this PIN or scan the QR code to join</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 p-6 bg-muted/50 rounded-2xl">
              <div className="text-5xl lg:text-7xl font-black tracking-widest text-primary">
                {pin}
              </div>
              <Button
                onClick={handleCopyPin}
                size="lg"
                className="h-16 px-8 text-lg"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="p-8 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG
                value={`${window.location.origin}/join?pin=${pin}`}
                size={256}
                level="H"
                includeMargin
              />
            </div>

            <Button
              size="lg"
              className="mt-4 w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setLocation(`/hunt/${huntId}/live`)}
            >
              <Trophy className="mr-2 h-5 w-5" />
              Start the Hunt
            </Button>
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card className="p-6 lg:p-8 shadow-xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              Teams Joined
              <span className="text-sm font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {huntTeams.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {huntTeams.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Waiting for teams to join...
              </div>
            ) : (
              huntTeams.map((team: any, index: number) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Ready to play</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Just now
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
