import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Trophy, Users, AlertTriangle, Zap, Activity, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppContext } from "@/context/AppContext";
import { fetchAPI } from "@/lib/api";
import { io, Socket } from "socket.io-client";

type AdminStreamEvent = {
  id: string;
  timestamp: string;
  teamName: string;
  huntId: string;
  clueTitle: string;
  attemptStatus: "success" | "failure";
  type: "text" | "image" | "puzzle";
};

export default function AdminDashboard() {
  const [, params] = useRoute("/admin/hunts/:huntId");
  const [, setLocation] = useLocation();
  const { hunts, teams, currentUser } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [streamEvents, setStreamEvents] = useState<AdminStreamEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const huntId = params?.huntId;
  const hunt = hunts.find(h => h.id === huntId);
  const huntTeams = teams.filter(t => t.huntId === huntId);

  useEffect(() => {
    if (!huntId) return;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socket = io(apiUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Admin connected to WebSocket");
      socket.emit("join_admin_global");
    });

    socket.on("admin_stream_update", (event: AdminStreamEvent) => {
      // Only add events that match the current huntId
      if (event.huntId === huntId) {
        setStreamEvents((prev) => [
          { ...event, id: Date.now().toString() },
          ...prev.slice(0, 49),
        ]);
      }
    });

    socket.on("disconnect", () => {
      console.log("Admin disconnected from WebSocket");
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [huntId]);

  const handleForceAdvance = async (teamId: string, markAsCompleted = false) => {
    setIsLoading(true);
    setError("");
    try {
      await fetchAPI(`/api/v1/admin/teams/${teamId}/force-advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAsCompleted }),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to advance team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-4rem)]">
      <Button variant="ghost" onClick={() => setLocation("/dashboard/creator")} className="mb-6 -ml-4 text-muted-foreground">
        <ArrowLeft className="mr-2" size={16} /> Back to Creator Dashboard
      </Button>

      {!hunt ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Hunt not found</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{hunt.title} — Live Dashboard</h1>
            <p className="text-muted-foreground text-lg">Monitor your hunt in real-time and intervene if needed</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold">{huntTeams.length}</div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <div className="text-3xl font-bold">{huntTeams.filter(t => t.status === "complete").length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-3xl font-bold">{huntTeams.filter(t => t.status === "active").length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <div className="text-3xl font-bold">{huntTeams.filter(t => t.failedAttempts >= 2).length}</div>
                <div className="text-sm text-muted-foreground">Stuck</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="teams">
            <TabsList className="mb-6">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="stream">Live Stream</TabsTrigger>
            </TabsList>

            <TabsContent value="teams">
              <div className="grid gap-4">
                {huntTeams.map(team => (
                  <Card key={team.id} className="border shadow-sm overflow-hidden">
                    <CardHeader className="p-4 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          team.status === "complete" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        }`}>{team.status === "complete" ? "Completed" : "Active"}</div>
                      </div>
                      <CardDescription>
                        On Clue {team.currentClueIndex + 1} of {hunt.clues.length} • {team.failedAttempts} failed attempts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleForceAdvance(team.id, false)}
                          disabled={isLoading}
                        >
                          <SkipForward size={16} className="mr-1" /> Force Advance
                        </Button>
                        {team.status !== "complete" && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleForceAdvance(team.id, true)}
                            disabled={isLoading}
                          >
                            <Zap size={16} className="mr-1" /> Mark Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stream">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Live Event Stream</CardTitle>
                  <CardDescription>All actions happening in your hunt</CardDescription>
                </CardHeader>
                <CardContent className="divide-y max-h-[600px] overflow-y-auto">
                  {streamEvents.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">No events yet - waiting for teams to start!</div>
                  ) : (
                    streamEvents.map(event => (
                      <div key={event.id} className="py-3 flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          event.attemptStatus === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                        }`}>
                          {event.attemptStatus === "success" ? <Trophy size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{event.teamName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.attemptStatus === "success" ? "Solved" : "Failed"} {event.clueTitle} ({event.type})
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
