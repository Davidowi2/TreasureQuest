import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppProvider } from "@/context/AppContext";
import { Nav } from "@/components/Nav";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import HuntDiscovery from "@/pages/HuntDiscovery";
import HuntJoin from "@/pages/HuntJoin";
import CreatorDashboard from "@/pages/CreatorDashboard";
import CreateHunt from "@/pages/CreateHunt";
import TeamLobby from "@/pages/TeamLobby";
import ActiveGame from "@/pages/ActiveGame";
import GameComplete from "@/pages/GameComplete";
import PlayerDashboard from "@/pages/PlayerDashboard";
import NotFound from "@/pages/not-found";
import Leaderboard from "@/pages/Leaderboard";
import HuntDetail from "@/pages/HuntDetail";
import Achievements from "@/pages/Achievements";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/achievements" component={Achievements} />

      <Route path="/hunts" component={HuntDiscovery} />
      <Route path="/hunts/new" component={CreateHunt} />
      <Route path="/hunts/:id/join" component={HuntJoin} />
      <Route path="/hunts/:id" component={HuntDetail} />
      
      <Route path="/dashboard/creator" component={CreatorDashboard} />
      <Route path="/dashboard/player" component={PlayerDashboard} />
      
      <Route path="/team/:teamId/lobby" component={TeamLobby} />
      <Route path="/game/:teamId" component={ActiveGame} />
      <Route path="/game/:teamId/complete" component={GameComplete} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
              <Nav />
              <main className="flex-grow">
                <Router />
              </main>
            </div>
          </WouterRouter>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
