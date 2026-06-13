import React, { createContext, useContext, useState } from 'react';

type Role = "creator" | "player" | "both";
export type Difficulty = "easy" | "medium" | "hard";
type HuntStatus = "draft" | "published" | "archived";
type TeamStatus = "lobby" | "active" | "complete";

export type User = { id: string; name: string; email: string; role: Role; avatar?: string; };
export type Clue = { id: string; huntId: string; order: number; hint: string; hintUnlockText: string; mediaUrl?: string; referenceImageUrl?: string; };
export type Hunt = { 
  id: string; creatorId: string; creatorName: string; title: string; description: string; 
  difficulty: Difficulty; locationTag: string; status: HuntStatus; clues: Clue[]; 
  isShuffled: boolean; createdAt: string; 
  huntType: "photography" | "riddle" | "trivia" | "exploration";
  minTeamSize: number;
  maxTeamSize: number;
  timeLimit?: number; // minutes, optional
  estimatedDuration: string; // e.g. "45 min"
  totalPlayers: number;
  completionRate: number; // 0-100
  rating: number; // 1.0-5.0
  ratingCount: number;
};
export type TeamMember = { userId: string; name: string; isActive: boolean; isLeader: boolean; };
export type Team = { id: string; huntId: string; name: string; inviteCode: string; members: TeamMember[]; status: TeamStatus; currentClueIndex: number; startTime?: string; endTime?: string; failedAttempts: number; completedAt?: string; totalTime?: number; };

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  hunts: Hunt[];
  setHunts: React.Dispatch<React.SetStateAction<Hunt[]>>;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  users: User[];
}

const mockUsers: User[] = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", role: "creator" },
  { id: "u2", name: "Bob Martinez", email: "bob@example.com", role: "player" },
  { id: "u3", name: "Carol Smith", email: "carol@example.com", role: "both" },
  { id: "u4", name: "David Park", email: "david@example.com", role: "creator" },
  { id: "u5", name: "Eva Johnson", email: "eva@example.com", role: "player" },
];

const mockHunts: Hunt[] = [
  {
    id: "h1", creatorId: "u1", creatorName: "Alice Chen", title: "The Lost Library", description: "Discover the hidden archives of the old city library.", difficulty: "hard", locationTag: "Downtown", status: "published", isShuffled: false, createdAt: new Date().toISOString(),
    huntType: "riddle", minTeamSize: 2, maxTeamSize: 6, timeLimit: 90, estimatedDuration: "60-90 min", totalPlayers: 312, completionRate: 64, rating: 4.8, ratingCount: 89,
    clues: [
      { id: "c1", huntId: "h1", order: 1, hint: "Where words go to sleep.", hintUnlockText: "Check the basement archives." },
      { id: "c2", huntId: "h1", order: 2, hint: "Look for the owl.", hintUnlockText: "The bronze owl statue near section B." },
      { id: "c3", huntId: "h1", order: 3, hint: "A book with no title.", hintUnlockText: "Third shelf, red spine." },
      { id: "c4", huntId: "h1", order: 4, hint: "The librarian's secret.", hintUnlockText: "Ask about the midnight reading." },
      { id: "c5", huntId: "h1", order: 5, hint: "The final page.", hintUnlockText: "Under the main desk." }
    ]
  },
  {
    id: "h2", creatorId: "u1", creatorName: "Alice Chen", title: "Harbor Secrets", description: "Follow the seagulls to maritime treasure.", difficulty: "medium", locationTag: "Waterfront", status: "published", isShuffled: true, createdAt: new Date().toISOString(),
    huntType: "photography", minTeamSize: 1, maxTeamSize: 8, estimatedDuration: "30-45 min", totalPlayers: 527, completionRate: 81, rating: 4.6, ratingCount: 134,
    clues: [
      { id: "c6", huntId: "h2", order: 1, hint: "Where the big ships dock.", hintUnlockText: "Pier 39." },
      { id: "c7", huntId: "h2", order: 2, hint: "The rusty anchor.", hintUnlockText: "Near the old seafood restaurant." },
      { id: "c8", huntId: "h2", order: 3, hint: "Look out to sea.", hintUnlockText: "The telescopes on the boardwalk." },
      { id: "c9", huntId: "h2", order: 4, hint: "The wooden captain.", hintUnlockText: "Statue at the maritime museum." }
    ]
  },
  {
    id: "h3", creatorId: "u4", creatorName: "David Park", title: "Campus Mystery", description: "A quick hunt around the main university quad.", difficulty: "easy", locationTag: "University", status: "published", isShuffled: false, createdAt: new Date().toISOString(),
    huntType: "exploration", minTeamSize: 1, maxTeamSize: 10, estimatedDuration: "20-30 min", totalPlayers: 891, completionRate: 92, rating: 4.3, ratingCount: 201,
    clues: [
      { id: "c10", huntId: "h3", order: 1, hint: "The founder's gaze.", hintUnlockText: "Statue in the center quad." },
      { id: "c11", huntId: "h3", order: 2, hint: "Where math meets science.", hintUnlockText: "The physics building courtyard." },
      { id: "c12", huntId: "h3", order: 3, hint: "The oldest tree.", hintUnlockText: "The large oak near the dorms." },
      { id: "c13", huntId: "h3", order: 4, hint: "Student fuel.", hintUnlockText: "The main campus coffee shop." }
    ]
  },
  {
    id: "h4", creatorId: "u4", creatorName: "David Park", title: "Art District Riddles", description: "Explore the vibrant murals of SoMa.", difficulty: "medium", locationTag: "SoMa", status: "published", isShuffled: false, createdAt: new Date().toISOString(),
    huntType: "trivia", minTeamSize: 2, maxTeamSize: 6, estimatedDuration: "45-60 min", totalPlayers: 445, completionRate: 73, rating: 4.7, ratingCount: 112,
    clues: [
      { id: "c14", huntId: "h4", order: 1, hint: "The blue tiger.", hintUnlockText: "Mural on 5th street." },
      { id: "c15", huntId: "h4", order: 2, hint: "Neon dreams.", hintUnlockText: "The gallery window display." },
      { id: "c16", huntId: "h4", order: 3, hint: "Painted stairs.", hintUnlockText: "The alleyway next to the cafe." },
      { id: "c17", huntId: "h4", order: 4, hint: "The mosaic eye.", hintUnlockText: "Look up at the corner of 6th." },
      { id: "c18", huntId: "h4", order: 5, hint: "The final canvas.", hintUnlockText: "The community center wall." }
    ]
  },
  {
    id: "h5", creatorId: "u1", creatorName: "Alice Chen", title: "Secret Garden", description: "Hidden botanical wonders.", difficulty: "easy", locationTag: "Botanical Park", status: "draft", isShuffled: false, createdAt: new Date().toISOString(),
    huntType: "photography", minTeamSize: 1, maxTeamSize: 6, estimatedDuration: "25-35 min", totalPlayers: 0, completionRate: 0, rating: 0, ratingCount: 0,
    clues: [
      { id: "c19", huntId: "h5", order: 1, hint: "The thorny path.", hintUnlockText: "The cactus garden." },
      { id: "c20", huntId: "h5", order: 2, hint: "Lily pads.", hintUnlockText: "The koi pond." },
      { id: "c21", huntId: "h5", order: 3, hint: "The glass house.", hintUnlockText: "The main conservatory." },
      { id: "c22", huntId: "h5", order: 4, hint: "Bonsai corner.", hintUnlockText: "The Japanese garden." }
    ]
  },
  {
    id: "h6", creatorId: "u4", creatorName: "David Park", title: "The Clock Tower", description: "Time is ticking.", difficulty: "hard", locationTag: "Old Town", status: "draft", isShuffled: false, createdAt: new Date().toISOString(),
    huntType: "riddle", minTeamSize: 2, maxTeamSize: 4, timeLimit: 120, estimatedDuration: "90-120 min", totalPlayers: 0, completionRate: 0, rating: 0, ratingCount: 0,
    clues: [
      { id: "c23", huntId: "h6", order: 1, hint: "The first bell.", hintUnlockText: "The town square." },
      { id: "c24", huntId: "h6", order: 2, hint: "Cobblestone steps.", hintUnlockText: "The path leading up the hill." },
      { id: "c25", huntId: "h6", order: 3, hint: "The gargoyle's view.", hintUnlockText: "The cathedral roof." },
      { id: "c26", huntId: "h6", order: 4, hint: "Midnight strikes.", hintUnlockText: "The base of the tower." }
    ]
  }
];

const mockTeams: Team[] = [
  {
    id: "t1", huntId: "h1", name: "Codebreakers", inviteCode: "ABCDEF", status: "lobby", currentClueIndex: 0, failedAttempts: 0,
    members: [
      { userId: "u2", name: "Bob Martinez", isActive: true, isLeader: true },
      { userId: "u3", name: "Carol Smith", isActive: true, isLeader: false },
      { userId: "u5", name: "Eva Johnson", isActive: false, isLeader: false }
    ]
  },
  {
    id: "t2", huntId: "h2", name: "Night Owls", inviteCode: "XYZ123", status: "active", currentClueIndex: 1, failedAttempts: 1, startTime: new Date().toISOString(),
    members: [
      { userId: "u3", name: "Carol Smith", isActive: true, isLeader: true },
      { userId: "u5", name: "Eva Johnson", isActive: true, isLeader: false }
    ]
  },
  {
    id: "t3", huntId: "h3", name: "The Squad", inviteCode: "QWERTY", status: "complete", currentClueIndex: 3, failedAttempts: 0, startTime: new Date(Date.now() - 18 * 60000).toISOString(), completedAt: new Date().toISOString(), totalTime: 18 * 60,
    members: [
      { userId: "u2", name: "Bob Martinez", isActive: false, isLeader: true },
      { userId: "u5", name: "Eva Johnson", isActive: false, isLeader: false }
    ]
  },
  { id: "t4", huntId: "h1", name: "Puzzle Masters", inviteCode: "PM1234", status: "complete", currentClueIndex: 4, failedAttempts: 2, startTime: new Date(Date.now() - 75*60000).toISOString(), completedAt: new Date(Date.now() - 15*60000).toISOString(), totalTime: 60*60, members: [{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:true},{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:false}] },
  { id: "t5", huntId: "h1", name: "Ink & Quill", inviteCode: "IQ5678", status: "complete", currentClueIndex: 4, failedAttempts: 5, startTime: new Date(Date.now() - 120*60000).toISOString(), completedAt: new Date(Date.now() - 40*60000).toISOString(), totalTime: 80*60, members: [{userId:"u3",name:"Carol Smith",isActive:false,isLeader:true}] },
  { id: "t6", huntId: "h2", name: "Shutter Crew", inviteCode: "SC9012", status: "complete", currentClueIndex: 3, failedAttempts: 1, startTime: new Date(Date.now() - 50*60000).toISOString(), completedAt: new Date(Date.now() - 20*60000).toISOString(), totalTime: 30*60, members: [{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:true},{userId:"u3",name:"Carol Smith",isActive:false,isLeader:false}] },
  { id: "t7", huntId: "h2", name: "Lens Legends", inviteCode: "LL3456", status: "complete", currentClueIndex: 3, failedAttempts: 0, startTime: new Date(Date.now() - 45*60000).toISOString(), completedAt: new Date(Date.now() - 10*60000).toISOString(), totalTime: 35*60, members: [{userId:"u4",name:"David Park",isActive:false,isLeader:true}] },
  { id: "t8", huntId: "h2", name: "Sea Dogs", inviteCode: "SD7890", status: "complete", currentClueIndex: 3, failedAttempts: 3, startTime: new Date(Date.now() - 60*60000).toISOString(), completedAt: new Date(Date.now() - 12*60000).toISOString(), totalTime: 48*60, members: [{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:true}] },
  { id: "t9", huntId: "h3", name: "Campus Crew", inviteCode: "CC1111", status: "complete", currentClueIndex: 3, failedAttempts: 0, startTime: new Date(Date.now() - 30*60000).toISOString(), completedAt: new Date(Date.now() - 12*60000).toISOString(), totalTime: 18*60, members: [{userId:"u3",name:"Carol Smith",isActive:false,isLeader:true}] },
  { id: "t10", huntId: "h3", name: "Study Breakers", inviteCode: "SB2222", status: "complete", currentClueIndex: 3, failedAttempts: 1, startTime: new Date(Date.now() - 40*60000).toISOString(), completedAt: new Date(Date.now() - 18*60000).toISOString(), totalTime: 22*60, members: [{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:true},{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:false}] },
  { id: "t11", huntId: "h3", name: "Quad Runners", inviteCode: "QR3333", status: "complete", currentClueIndex: 3, failedAttempts: 2, startTime: new Date(Date.now() - 55*60000).toISOString(), completedAt: new Date(Date.now() - 25*60000).toISOString(), totalTime: 30*60, members: [{userId:"u4",name:"David Park",isActive:false,isLeader:true}] },
  { id: "t12", huntId: "h4", name: "Art Explorers", inviteCode: "AE4444", status: "complete", currentClueIndex: 4, failedAttempts: 1, startTime: new Date(Date.now() - 65*60000).toISOString(), completedAt: new Date(Date.now() - 15*60000).toISOString(), totalTime: 50*60, members: [{userId:"u3",name:"Carol Smith",isActive:false,isLeader:true},{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:false}] },
  { id: "t13", huntId: "h4", name: "Mural Hunters", inviteCode: "MH5555", status: "complete", currentClueIndex: 4, failedAttempts: 4, startTime: new Date(Date.now() - 90*60000).toISOString(), completedAt: new Date(Date.now() - 28*60000).toISOString(), totalTime: 62*60, members: [{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:true}] }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hunts, setHunts] = useState<Hunt[]>(mockHunts);
  const [teams, setTeams] = useState<Team[]>(mockTeams);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, hunts, setHunts, teams, setTeams, users: mockUsers }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
