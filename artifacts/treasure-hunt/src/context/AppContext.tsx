import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAPI, setToken, removeToken, getToken } from "@/lib/api";

type Role = "creator" | "player" | "both";
export type Difficulty = "easy" | "medium" | "hard";
type HuntStatus = "draft" | "published" | "archived";
type TeamStatus = "lobby" | "active" | "complete";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  howTo: string;
  icon: string;
  rarity: AchievementRarity;
  category: "explorer" | "creator" | "team" | "speed" | "mastery";
};

export type UserAchievement = {
  achievementId: string;
  userId: string;
  earnedAt: string;
  huntId?: string;
  teamName?: string;
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_steps", title: "First Steps", description: "Completed your very first hunt", howTo: "Complete any hunt", icon: "Compass", rarity: "common", category: "explorer" },
  { id: "team_spirit", title: "Team Spirit", description: "Completed a hunt with 3 or more teammates", howTo: "Finish a hunt with 3+ team members", icon: "Users", rarity: "common", category: "team" },
  { id: "comeback_kid", title: "Comeback Kid", description: "Completed a hunt after 5+ failed attempts", howTo: "Get 5+ fails and still complete the hunt", icon: "RefreshCw", rarity: "common", category: "explorer" },
  { id: "map_maker", title: "Map Maker", description: "Published your first hunt as a creator", howTo: "Create and publish a hunt", icon: "MapPin", rarity: "common", category: "creator" },
  { id: "hard_boiled", title: "Hard Boiled", description: "Conquered a hard difficulty hunt", howTo: "Complete a hunt rated Hard", icon: "Flame", rarity: "rare", category: "mastery" },
  { id: "perfectionist", title: "Perfectionist", description: "Completed a hunt with zero failed attempts", howTo: "Finish a hunt without a single fail", icon: "Target", rarity: "rare", category: "mastery" },
  { id: "speed_demon", title: "Speed Demon", description: "Blasted through a hunt in under 20 minutes", howTo: "Complete any hunt in under 20 minutes", icon: "Zap", rarity: "rare", category: "speed" },
  { id: "riddle_master", title: "Riddle Master", description: "Completed 3 riddle-type hunts", howTo: "Finish 3 Riddle hunts", icon: "Brain", rarity: "rare", category: "mastery" },
  { id: "lens_hero", title: "Lens Hero", description: "Completed 3 photography-type hunts", howTo: "Finish 3 Photography hunts", icon: "Camera", rarity: "rare", category: "mastery" },
  { id: "lightning_fast", title: "Lightning Fast", description: "Finished a hunt in under 15 minutes", howTo: "Complete any hunt in under 15 minutes", icon: "Timer", rarity: "epic", category: "speed" },
  { id: "type_collector", title: "Type Collector", description: "Completed all 4 hunt types", howTo: "Finish one hunt of every type", icon: "Layers", rarity: "epic", category: "mastery" },
  { id: "hunt_legend", title: "Hunt Legend", description: "Completed 5 or more hunts", howTo: "Finish 5 hunts total", icon: "Crown", rarity: "legendary", category: "explorer" },
];

export type User = { id: string; name: string; email: string; role: Role; avatar?: string; };
export type GameMode = "team" | "solo";

export type ClueType = "text" | "image" | "audio";
export type Clue = { id: string; huntId: string; order: number; hint: string; hintUnlockText: string; clueType: ClueType; mediaUrl?: string; audioUrl?: string; referenceImageUrl?: string; };
export type Hunt = {
  id: string; creatorId: string; creatorName: string; title: string; description: string;
  difficulty: Difficulty; locationTag: string; status: HuntStatus; clues: Clue[];
  isShuffled: boolean; createdAt: string;
  gameMode: GameMode;
  huntType: "photography" | "riddle" | "trivia" | "exploration";
  minTeamSize: number;
  maxTeamSize: number;
  timeLimit?: number;
  estimatedDuration: string;
  totalPlayers: number;
  completionRate: number;
  rating: number;
  ratingCount: number;
};
export type TeamMember = { userId: string; name: string; isActive: boolean; isLeader: boolean; };

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
};

export type Team = { id: string; huntId: string; name: string; inviteCode: string; members: TeamMember[]; status: TeamStatus; currentClueIndex: number; failedAttempts: number; startTime?: string; endTime?: string; completedAt?: string; totalTime?: number; messages: ChatMessage[]; };

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  hunts: Hunt[];
  setHunts: React.Dispatch<React.SetStateAction<Hunt[]>>;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  users: User[];
  userAchievements: Record<string, UserAchievement[]>;
  setUserAchievements: React.Dispatch<React.SetStateAction<Record<string, UserAchievement[]>>>;
  awardAchievements: (userId: string, ids: string[], huntId?: string, teamName?: string) => UserAchievement[];
  sendMessage: (teamId: string, text: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchHunts: (filters?: { difficulty?: string; locationTag?: string; search?: string }) => Promise<void>;
  isLoading: boolean;
}

export function evaluateAchievements(userId: string, teams: Team[], hunts: Hunt[], existing: UserAchievement[]): string[] {
  const earnedIds = existing.map(a => a.achievementId);
  const newIds: string[] = [];

  const userTeams = teams.filter(t => t.members.some(m => m.userId === userId));
  const completedTeams = userTeams.filter(t => t.status === "complete");

  if (!earnedIds.includes("first_steps") && completedTeams.length > 0) {
    newIds.push("first_steps");
  }

  if (!earnedIds.includes("team_spirit") && completedTeams.some(t => t.members.length >= 3)) {
    newIds.push("team_spirit");
  }

  if (!earnedIds.includes("comeback_kid") && completedTeams.some(t => t.failedAttempts >= 5)) {
    newIds.push("comeback_kid");
  }

  if (!earnedIds.includes("perfectionist") && completedTeams.some(t => t.failedAttempts === 0)) {
    newIds.push("perfectionist");
  }

  if (!earnedIds.includes("speed_demon") && completedTeams.some(t => t.totalTime && t.totalTime <= 20 * 60)) {
    newIds.push("speed_demon");
  }

  if (!earnedIds.includes("lightning_fast") && completedTeams.some(t => t.totalTime && t.totalTime <= 15 * 60)) {
    newIds.push("lightning_fast");
  }

  if (!earnedIds.includes("hard_boiled")) {
    const hasHard = completedTeams.some(t => {
      const hunt = hunts.find(h => h.id === t.huntId);
      return hunt?.difficulty === "hard";
    });
    if (hasHard) newIds.push("hard_boiled");
  }

  if (!earnedIds.includes("hunt_legend") && completedTeams.length >= 5) {
    newIds.push("hunt_legend");
  }

  const completedHuntTypes = new Set<string>();
  completedTeams.forEach(t => {
    const hunt = hunts.find(h => h.id === t.huntId);
    if (hunt) completedHuntTypes.add(hunt.huntType);
  });

  if (!earnedIds.includes("riddle_master") && completedTeams.filter(t => {
    const hunt = hunts.find(h => h.id === t.huntId);
    return hunt?.huntType === "riddle";
  }).length >= 3) {
    newIds.push("riddle_master");
  }

  if (!earnedIds.includes("lens_hero") && completedTeams.filter(t => {
    const hunt = hunts.find(h => h.id === t.huntId);
    return hunt?.huntType === "photography";
  }).length >= 3) {
    newIds.push("lens_hero");
  }

  if (!earnedIds.includes("type_collector") && completedHuntTypes.size >= 4) {
    newIds.push("type_collector");
  }

  return newIds;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userAchievements, setUserAchievements] = useState<Record<string, UserAchievement[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const data = await fetchAPI<{ user: User }>("/api/v1/auth/me");
      setCurrentUser(data.user);
    } catch {
      removeToken();
      setCurrentUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await fetchAPI<{ user: User; token: string }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setCurrentUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: Role = "both") => {
    setIsLoading(true);
    try {
      const data = await fetchAPI<{ user: User; token: string }>("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      setToken(data.token);
      setCurrentUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const data = await fetchAPI<{ user: User; token: string }>("/api/v1/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      setToken(data.token);
      setCurrentUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetchAPI("/api/v1/auth/logout", { method: "POST" });
    } finally {
      removeToken();
      setCurrentUser(null);
    }
  };

  const fetchHunts = async (filters?: { difficulty?: string; locationTag?: string; search?: string }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.difficulty) params.set("difficulty", filters.difficulty);
      if (filters?.locationTag) params.set("locationTag", filters.locationTag);
      if (filters?.search) params.set("search", filters.search);

      const data = await fetchAPI<Hunt[]>(`/api/v1/hunts?${params.toString()}`);
      setHunts(data);
    } finally {
      setIsLoading(false);
    }
  };

  const awardAchievements = (userId: string, ids: string[], huntId?: string, teamName?: string): UserAchievement[] => {
    const newOnes: UserAchievement[] = ids.map(id => ({
      achievementId: id,
      userId,
      earnedAt: new Date().toISOString(),
      huntId,
      teamName,
    }));
    setUserAchievements(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), ...newOnes],
    }));
    return newOnes;
  };

  const sendMessage = (teamId: string, text: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString(),
    };
    setTeams(prev =>
      prev.map(t => t.id === teamId ? { ...t, messages: [...t.messages, msg] } : t)
    );
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, hunts, setHunts, teams, setTeams, users: [],
      userAchievements, setUserAchievements, awardAchievements, sendMessage,
      login, signup, googleLogin, logout, fetchHunts, isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
