import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';

type Role = "creator" | "player" | "both";
export type Difficulty = "easy" | "medium" | "hard";
type HuntStatus = "draft" | "published" | "archived";
type TeamStatus = "lobby" | "active" | "complete";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type Achievement = {
  id: string;
  title: string;
  description: string;       // what you did to earn it
  howTo: string;             // hint for locked state: "Complete your first hunt"
  icon: string;              // lucide icon name as string (used for lookup)
  rarity: AchievementRarity;
  category: "explorer" | "creator" | "team" | "speed" | "mastery";
};

export type UserAchievement = {
  achievementId: string;
  userId: string;
  earnedAt: string;          // ISO date
  huntId?: string;           // which hunt triggered it
  teamName?: string;
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_steps",    title: "First Steps",      description: "Completed your very first hunt",                howTo: "Complete any hunt",                        icon: "Compass",    rarity: "common",    category: "explorer" },
  { id: "team_spirit",    title: "Team Spirit",       description: "Completed a hunt with 3 or more teammates",   howTo: "Finish a hunt with 3+ team members",       icon: "Users",      rarity: "common",    category: "team"     },
  { id: "comeback_kid",   title: "Comeback Kid",      description: "Finished a hunt after 5+ failed attempts",    howTo: "Get 5+ fails and still complete the hunt", icon: "RefreshCw",  rarity: "common",    category: "explorer" },
  { id: "map_maker",      title: "Map Maker",         description: "Published your first hunt as a creator",      howTo: "Create and publish a hunt",                icon: "MapPin",     rarity: "common",    category: "creator"  },
  { id: "hard_boiled",    title: "Hard Boiled",       description: "Conquered a hard difficulty hunt",            howTo: "Complete a hunt rated Hard",               icon: "Flame",      rarity: "rare",      category: "mastery"  },
  { id: "perfectionist",  title: "Perfectionist",     description: "Completed a hunt with zero failed attempts",  howTo: "Finish a hunt without a single fail",      icon: "Target",     rarity: "rare",      category: "mastery"  },
  { id: "speed_demon",    title: "Speed Demon",        description: "Blasted through a hunt in under 20 minutes", howTo: "Complete any hunt in under 20 minutes",    icon: "Zap",        rarity: "rare",      category: "speed"    },
  { id: "riddle_master",  title: "Riddle Master",     description: "Completed 3 riddle-type hunts",               howTo: "Finish 3 Riddle hunts",                    icon: "Brain",      rarity: "rare",      category: "mastery"  },
  { id: "lens_hero",      title: "Lens Hero",         description: "Completed 3 photography-type hunts",          howTo: "Finish 3 Photography hunts",               icon: "Camera",     rarity: "rare",      category: "mastery"  },
  { id: "lightning_fast", title: "Lightning Fast",    description: "Finished a hunt in under 15 minutes",         howTo: "Complete any hunt in under 15 minutes",    icon: "Timer",      rarity: "epic",      category: "speed"    },
  { id: "type_collector", title: "Type Collector",    description: "Completed all 4 hunt types",                  howTo: "Finish one hunt of every type",            icon: "Layers",     rarity: "epic",      category: "mastery"  },
  { id: "hunt_legend",    title: "Hunt Legend",       description: "Completed 5 or more hunts",                   howTo: "Finish 5 hunts total",                     icon: "Crown",      rarity: "legendary", category: "explorer" },
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
  timeLimit?: number; // minutes, optional
  estimatedDuration: string; // e.g. "45 min"
  totalPlayers: number;
  completionRate: number; // 0-100
  rating: number; // 1.0-5.0
  ratingCount: number;
};
export type TeamMember = { userId: string; name: string; isActive: boolean; isLeader: boolean; };

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string; // ISO
  isSystem?: boolean; // for join/leave/start notices styled differently
};

export type Team = { id: string; huntId: string; name: string; inviteCode: string; members: TeamMember[]; status: TeamStatus; currentClueIndex: number; startTime?: string; endTime?: string; failedAttempts: number; completedAt?: string; totalTime?: number; messages: ChatMessage[]; };

const mockUsers: User[] = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", role: "creator" },
  { id: "u2", name: "Bob Martinez", email: "bob@example.com", role: "player" },
  { id: "u3", name: "Carol Smith", email: "carol@example.com", role: "both" },
  { id: "u4", name: "David Park", email: "david@example.com", role: "creator" },
  { id: "u5", name: "Eva Johnson", email: "eva@example.com", role: "player" },
];

const mockHunts: Hunt[] = [
  {
    id: "h1", creatorId: "u1", creatorName: "Alice Chen", title: "The Lost Library", description: "Discover the hidden archives of the old city library.", difficulty: "hard", locationTag: "Downtown", status: "published", isShuffled: false, createdAt: new Date().toISOString(), gameMode: "team",
    huntType: "riddle", minTeamSize: 2, maxTeamSize: 6, timeLimit: 90, estimatedDuration: "60-90 min", totalPlayers: 312, completionRate: 64, rating: 4.8, ratingCount: 89,
    clues: [
      { id: "c1", huntId: "h1", order: 1, hint: "Where words go to sleep.", hintUnlockText: "Check the basement archives.", clueType: "text" },
      { id: "c2", huntId: "h1", order: 2, hint: "Look for the owl.", hintUnlockText: "The bronze owl statue near section B.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80" },
      { id: "c3", huntId: "h1", order: 3, hint: "A book with no title.", hintUnlockText: "Third shelf, red spine.", clueType: "text" },
      { id: "c4", huntId: "h1", order: 4, hint: "The librarian's secret.", hintUnlockText: "Ask about the midnight reading.", clueType: "audio", audioUrl: "/mock-audio/clue-h1-c4.mp3" },
      { id: "c5", huntId: "h1", order: 5, hint: "The final page.", hintUnlockText: "Under the main desk.", clueType: "text" }
    ]
  },
  {
    id: "h2", creatorId: "u1", creatorName: "Alice Chen", title: "Harbor Secrets", description: "Follow the seagulls to maritime treasure.", difficulty: "medium", locationTag: "Waterfront", status: "published", isShuffled: true, createdAt: new Date().toISOString(), gameMode: "team",
    huntType: "photography", minTeamSize: 1, maxTeamSize: 8, estimatedDuration: "30-45 min", totalPlayers: 527, completionRate: 81, rating: 4.6, ratingCount: 134,
    clues: [
      { id: "c6", huntId: "h2", order: 1, hint: "Where the big ships dock.", hintUnlockText: "Pier 39.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { id: "c7", huntId: "h2", order: 2, hint: "The rusty anchor.", hintUnlockText: "Near the old seafood restaurant.", clueType: "text" },
      { id: "c8", huntId: "h2", order: 3, hint: "Look out to sea.", hintUnlockText: "The telescopes on the boardwalk.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80" },
      { id: "c9", huntId: "h2", order: 4, hint: "The wooden captain.", hintUnlockText: "Statue at the maritime museum.", clueType: "audio", audioUrl: "/mock-audio/clue-h2-c9.mp3" }
    ]
  },
  {
    id: "h3", creatorId: "u4", creatorName: "David Park", title: "Campus Mystery", description: "A quick hunt around the main university quad.", difficulty: "easy", locationTag: "University", status: "published", isShuffled: false, createdAt: new Date().toISOString(), gameMode: "team",
    huntType: "exploration", minTeamSize: 1, maxTeamSize: 10, estimatedDuration: "20-30 min", totalPlayers: 891, completionRate: 92, rating: 4.3, ratingCount: 201,
    clues: [
      { id: "c10", huntId: "h3", order: 1, hint: "The founder's gaze.", hintUnlockText: "Statue in the center quad.", clueType: "text" },
      { id: "c11", huntId: "h3", order: 2, hint: "Where math meets science.", hintUnlockText: "The physics building courtyard.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80" },
      { id: "c12", huntId: "h3", order: 3, hint: "The oldest tree.", hintUnlockText: "The large oak near the dorms.", clueType: "audio", audioUrl: "/mock-audio/clue-h3-c12.mp3" },
      { id: "c13", huntId: "h3", order: 4, hint: "Student fuel.", hintUnlockText: "The main campus coffee shop.", clueType: "text" }
    ]
  },
  {
    id: "h4", creatorId: "u4", creatorName: "David Park", title: "Art District Riddles", description: "Explore the vibrant murals of SoMa.", difficulty: "medium", locationTag: "SoMa", status: "published", isShuffled: false, createdAt: new Date().toISOString(), gameMode: "team",
    huntType: "trivia", minTeamSize: 2, maxTeamSize: 6, estimatedDuration: "45-60 min", totalPlayers: 445, completionRate: 73, rating: 4.7, ratingCount: 112,
    clues: [
      { id: "c14", huntId: "h4", order: 1, hint: "The blue tiger.", hintUnlockText: "Mural on 5th street.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800&q=80" },
      { id: "c15", huntId: "h4", order: 2, hint: "Neon dreams.", hintUnlockText: "The gallery window display.", clueType: "audio", audioUrl: "/mock-audio/clue-h4-c15.mp3" },
      { id: "c16", huntId: "h4", order: 3, hint: "Painted stairs.", hintUnlockText: "The alleyway next to the cafe.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80" },
      { id: "c17", huntId: "h4", order: 4, hint: "The mosaic eye.", hintUnlockText: "Look up at the corner of 6th.", clueType: "text" },
      { id: "c18", huntId: "h4", order: 5, hint: "The final canvas.", hintUnlockText: "The community center wall.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80" }
    ]
  },
  {
    id: "h5", creatorId: "u1", creatorName: "Alice Chen", title: "Secret Garden", description: "Hidden botanical wonders.", difficulty: "easy", locationTag: "Botanical Park", status: "draft", isShuffled: false, createdAt: new Date().toISOString(), gameMode: "team",
    huntType: "photography", minTeamSize: 1, maxTeamSize: 6, estimatedDuration: "25-35 min", totalPlayers: 0, completionRate: 0, rating: 0, ratingCount: 0,
    clues: [
      { id: "c19", huntId: "h5", order: 1, hint: "The thorny path.", hintUnlockText: "The cactus garden.", clueType: "text" },
      { id: "c20", huntId: "h5", order: 2, hint: "Lily pads.", hintUnlockText: "The koi pond.", clueType: "text" },
      { id: "c21", huntId: "h5", order: 3, hint: "The glass house.", hintUnlockText: "The main conservatory.", clueType: "text" },
      { id: "c22", huntId: "h5", order: 4, hint: "Bonsai corner.", hintUnlockText: "The Japanese garden.", clueType: "text" }
    ]
  },
  {
    id: "h6", creatorId: "u4", creatorName: "David Park", title: "The Clock Tower", description: "Time is ticking.", difficulty: "hard", locationTag: "Old Town", status: "draft", isShuffled: false, createdAt: new Date().toISOString(), gameMode: "team",
    huntType: "riddle", minTeamSize: 2, maxTeamSize: 4, timeLimit: 120, estimatedDuration: "90-120 min", totalPlayers: 0, completionRate: 0, rating: 0, ratingCount: 0,
    clues: [
      { id: "c23", huntId: "h6", order: 1, hint: "The first bell.", hintUnlockText: "The town square.", clueType: "text" },
      { id: "c24", huntId: "h6", order: 2, hint: "Cobblestone steps.", hintUnlockText: "The path leading up the hill.", clueType: "text" },
      { id: "c25", huntId: "h6", order: 3, hint: "The gargoyle's view.", hintUnlockText: "The cathedral roof.", clueType: "text" },
      { id: "c26", huntId: "h6", order: 4, hint: "Midnight strikes.", hintUnlockText: "The base of the tower.", clueType: "text" }
    ]
  },
  {
    id: "h7",
    creatorId: "u1",
    creatorName: "Alice Chen",
    title: "The Midnight Cipher",
    description: "A personal puzzle crafted for one adventurer. Solve three encoded messages and find the hidden vault.",
    difficulty: "hard",
    locationTag: "Old Quarter",
    status: "published",
    isShuffled: false,
    createdAt: new Date().toISOString(),
    gameMode: "solo",
    huntType: "riddle",
    minTeamSize: 1,
    maxTeamSize: 1,
    timeLimit: 45,
    estimatedDuration: "30-45 min",
    totalPlayers: 23,
    completionRate: 78,
    rating: 4.9,
    ratingCount: 18,
    clues: [
      { id: "c27", huntId: "h7", order: 1, hint: "Three letters stand where two rivers meet.", hintUnlockText: "Find the bridge inscription at the confluence.", clueType: "text" },
      { id: "c28", huntId: "h7", order: 2, hint: "The clock reads the same forwards and backwards.", hintUnlockText: "Look for the palindrome time on the east tower.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&q=80" },
      { id: "c29", huntId: "h7", order: 3, hint: "Where silence speaks the loudest.", hintUnlockText: "The reading room in the old archive building.", clueType: "text" },
      { id: "c30", huntId: "h7", order: 4, hint: "The final cipher is in plain sight.", hintUnlockText: "The mosaic floor under the entrance arch.", clueType: "text" },
    ]
  },
  {
    id: "h8",
    creatorId: "u4",
    creatorName: "David Park",
    title: "Rooftop to Riverbank",
    description: "An exclusive solo adventure from the highest point to the water's edge. Meant for one.",
    difficulty: "medium",
    locationTag: "City Centre",
    status: "published",
    isShuffled: false,
    createdAt: new Date().toISOString(),
    gameMode: "solo",
    huntType: "exploration",
    minTeamSize: 1,
    maxTeamSize: 1,
    estimatedDuration: "25-35 min",
    totalPlayers: 11,
    completionRate: 91,
    rating: 4.7,
    ratingCount: 9,
    clues: [
      { id: "c31", huntId: "h8", order: 1, hint: "Start where the city breathes.", hintUnlockText: "The rooftop garden on the municipal building.", clueType: "text" },
      { id: "c32", huntId: "h8", order: 2, hint: "Follow the painted arrows down.", hintUnlockText: "The staircase murals on the south side.", clueType: "image", mediaUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
      { id: "c33", huntId: "h8", order: 3, hint: "Where the street performers gather at noon.", hintUnlockText: "The central plaza fountain.", clueType: "text" },
      { id: "c34", huntId: "h8", order: 4, hint: "The river remembers everything.", hintUnlockText: "The plaque at the riverbank heritage site.", clueType: "audio", audioUrl: "/mock-audio/clue-h8-c34.mp3" },
    ]
  }
];

const mockTeams: Team[] = [
  {
    id: "t1", huntId: "h1", name: "Codebreakers", inviteCode: "ABCDEF", status: "lobby", currentClueIndex: 0, failedAttempts: 0, messages: [],
    members: [
      { userId: "u2", name: "Bob Martinez", isActive: true, isLeader: true },
      { userId: "u3", name: "Carol Smith", isActive: true, isLeader: false },
      { userId: "u5", name: "Eva Johnson", isActive: false, isLeader: false }
    ]
  },
  {
    id: "t2", huntId: "h2", name: "Night Owls", inviteCode: "XYZ123", status: "active", currentClueIndex: 1, failedAttempts: 1, startTime: new Date().toISOString(), messages: [],
    members: [
      { userId: "u3", name: "Carol Smith", isActive: true, isLeader: true },
      { userId: "u5", name: "Eva Johnson", isActive: true, isLeader: false }
    ]
  },
  {
    id: "t3", huntId: "h3", name: "The Squad", inviteCode: "QWERTY", status: "complete", currentClueIndex: 3, failedAttempts: 0, startTime: new Date(Date.now() - 18 * 60000).toISOString(), completedAt: new Date().toISOString(), totalTime: 18 * 60,
    messages: [
      { id:"m1", userId:"u2", userName:"Bob Martinez", text:"ok let's go", timestamp: new Date(Date.now()-20*60000).toISOString() },
      { id:"m2", userId:"u5", userName:"Eva Johnson", text:"I see the statue! Running over now", timestamp: new Date(Date.now()-18*60000).toISOString() },
      { id:"m3", userId:"u2", userName:"Bob Martinez", text:"Got it! That was quick", timestamp: new Date(Date.now()-16*60000).toISOString() },
      { id:"m4", userId:"u5", userName:"Eva Johnson", text:"Next clue is by the coffee shop I think", timestamp: new Date(Date.now()-14*60000).toISOString() },
      { id:"m5", userId:"u2", userName:"Bob Martinez", text:"We did it!!", timestamp: new Date(Date.now()-12*60000).toISOString() },
    ],
    members: [
      { userId: "u2", name: "Bob Martinez", isActive: false, isLeader: true },
      { userId: "u5", name: "Eva Johnson", isActive: false, isLeader: false }
    ]
  },
  { id: "t4", huntId: "h1", name: "Puzzle Masters", inviteCode: "PM1234", status: "complete", currentClueIndex: 4, failedAttempts: 2, startTime: new Date(Date.now() - 75*60000).toISOString(), completedAt: new Date(Date.now() - 15*60000).toISOString(), totalTime: 60*60, messages: [], members: [{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:true},{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:false}] },
  { id: "t5", huntId: "h1", name: "Ink & Quill", inviteCode: "IQ5678", status: "complete", currentClueIndex: 4, failedAttempts: 5, startTime: new Date(Date.now() - 120*60000).toISOString(), completedAt: new Date(Date.now() - 40*60000).toISOString(), totalTime: 80*60, messages: [], members: [{userId:"u3",name:"Carol Smith",isActive:false,isLeader:true}] },
  { id: "t6", huntId: "h2", name: "Shutter Crew", inviteCode: "SC9012", status: "complete", currentClueIndex: 3, failedAttempts: 1, startTime: new Date(Date.now() - 50*60000).toISOString(), completedAt: new Date(Date.now() - 20*60000).toISOString(), totalTime: 30*60, messages: [], members: [{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:true},{userId:"u3",name:"Carol Smith",isActive:false,isLeader:false}] },
  { id: "t7", huntId: "h2", name: "Lens Legends", inviteCode: "LL3456", status: "complete", currentClueIndex: 3, failedAttempts: 0, startTime: new Date(Date.now() - 45*60000).toISOString(), completedAt: new Date(Date.now() - 10*60000).toISOString(), totalTime: 35*60, messages: [], members: [{userId:"u4",name:"David Park",isActive:false,isLeader:true}] },
  { id: "t8", huntId: "h2", name: "Sea Dogs", inviteCode: "SD7890", status: "complete", currentClueIndex: 3, failedAttempts: 3, startTime: new Date(Date.now() - 60*60000).toISOString(), completedAt: new Date(Date.now() - 12*60000).toISOString(), totalTime: 48*60, messages: [], members: [{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:true}] },
  { id: "t9", huntId: "h3", name: "Campus Crew", inviteCode: "CC1111", status: "complete", currentClueIndex: 3, failedAttempts: 0, startTime: new Date(Date.now() - 30*60000).toISOString(), completedAt: new Date(Date.now() - 12*60000).toISOString(), totalTime: 18*60, messages: [], members: [{userId:"u3",name:"Carol Smith",isActive:false,isLeader:true}] },
  { id: "t10", huntId: "h3", name: "Study Breakers", inviteCode: "SB2222", status: "complete", currentClueIndex: 3, failedAttempts: 1, startTime: new Date(Date.now() - 40*60000).toISOString(), completedAt: new Date(Date.now() - 18*60000).toISOString(), totalTime: 22*60, messages: [], members: [{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:true},{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:false}] },
  { id: "t11", huntId: "h3", name: "Quad Runners", inviteCode: "QR3333", status: "complete", currentClueIndex: 3, failedAttempts: 2, startTime: new Date(Date.now() - 55*60000).toISOString(), completedAt: new Date(Date.now() - 25*60000).toISOString(), totalTime: 30*60, messages: [], members: [{userId:"u4",name:"David Park",isActive:false,isLeader:true}] },
  { id: "t12", huntId: "h4", name: "Art Explorers", inviteCode: "AE4444", status: "complete", currentClueIndex: 4, failedAttempts: 1, startTime: new Date(Date.now() - 65*60000).toISOString(), completedAt: new Date(Date.now() - 15*60000).toISOString(), totalTime: 50*60, messages: [], members: [{userId:"u3",name:"Carol Smith",isActive:false,isLeader:true},{userId:"u2",name:"Bob Martinez",isActive:false,isLeader:false}] },
  { id: "t13", huntId: "h4", name: "Mural Hunters", inviteCode: "MH5555", status: "complete", currentClueIndex: 4, failedAttempts: 4, startTime: new Date(Date.now() - 90*60000).toISOString(), completedAt: new Date(Date.now() - 28*60000).toISOString(), totalTime: 62*60, messages: [], members: [{userId:"u5",name:"Eva Johnson",isActive:false,isLeader:true}] }
];

const mockUserAchievements: Record<string, UserAchievement[]> = {
  u2: [
    { achievementId: "first_steps",   userId: "u2", earnedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(), huntId: "h3", teamName: "The Squad" },
    { achievementId: "team_spirit",   userId: "u2", earnedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(), huntId: "h3", teamName: "The Squad" },
    { achievementId: "perfectionist", userId: "u2", earnedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(), huntId: "h3", teamName: "The Squad" },
    { achievementId: "speed_demon",   userId: "u2", earnedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(), huntId: "h3", teamName: "The Squad" },
  ],
  u3: [
    { achievementId: "first_steps",   userId: "u3", earnedAt: new Date(Date.now() - 5*24*60*60*1000).toISOString(), huntId: "h4", teamName: "Art Explorers" },
    { achievementId: "team_spirit",   userId: "u3", earnedAt: new Date(Date.now() - 5*24*60*60*1000).toISOString(), huntId: "h4", teamName: "Art Explorers" },
    { achievementId: "comeback_kid",  userId: "u3", earnedAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(), huntId: "h1", teamName: "Ink & Quill" },
    { achievementId: "perfectionist", userId: "u3", earnedAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(), huntId: "h3", teamName: "Campus Crew" },
    { achievementId: "speed_demon",   userId: "u3", earnedAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(), huntId: "h3", teamName: "Campus Crew" },
  ],
};

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
  signup: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  fetchHunts: (filters?: { difficulty?: string; locationTag?: string; search?: string }) => Promise<void>;
  isLoading: boolean;
}

// Function to evaluate achievements
export function evaluateAchievements(userId: string, teams: Team[], hunts: Hunt[], existing: UserAchievement[]): string[] {
  const earnedIds = existing.map(a => a.achievementId);
  const newIds: string[] = [];
  
  const userTeams = teams.filter(t => t.members.some(m => m.userId === userId));
  const completedTeams = userTeams.filter(t => t.status === "complete");
  
  // First steps
  if (!earnedIds.includes("first_steps") && completedTeams.length > 0) {
    newIds.push("first_steps");
  }
  
  // Team spirit
  if (!earnedIds.includes("team_spirit") && completedTeams.some(t => t.members.length >= 3)) {
    newIds.push("team_spirit");
  }
  
  // Comeback kid
  if (!earnedIds.includes("comeback_kid") && completedTeams.some(t => t.failedAttempts >= 5)) {
    newIds.push("comeback_kid");
  }
  
  // Perfectionist
  if (!earnedIds.includes("perfectionist") && completedTeams.some(t => t.failedAttempts === 0)) {
    newIds.push("perfectionist");
  }
  
  // Speed demon
  if (!earnedIds.includes("speed_demon") && completedTeams.some(t => t.totalTime && t.totalTime <= 20 * 60)) {
    newIds.push("speed_demon");
  }
  
  // Lightning fast
  if (!earnedIds.includes("lightning_fast") && completedTeams.some(t => t.totalTime && t.totalTime <= 15 * 60)) {
    newIds.push("lightning_fast");
  }
  
  // Map maker - we don't have real published hunts yet, so skip
  // Hard boiled - check if any completed hunt is hard difficulty
  if (!earnedIds.includes("hard_boiled")) {
    const hasHard = completedTeams.some(t => {
      const hunt = hunts.find(h => h.id === t.huntId);
      return hunt?.difficulty === "hard";
    });
    if (hasHard) newIds.push("hard_boiled");
  }
  
  // Hunt legend - 5 or more completed
  if (!earnedIds.includes("hunt_legend") && completedTeams.length >= 5) {
    newIds.push("hunt_legend");
  }
  
  // Riddle master, lens hero, type collector - count hunt types
  const completedHuntTypes = new Set<string>();
  completedTeams.forEach(t => {
    const hunt = hunts.find(h => h.id === t.huntId);
    if (hunt) completedHuntTypes.add(hunt.huntType);
  });
  
  if (!earnedIds.includes("riddle_master") && completedTeams.filter(t => {
    const hunt = hunts.find(h => h.id === t.huntId);
    return hunt?.huntType === "riddle";
  }).length >=3) {
    newIds.push("riddle_master");
  }
  
  if (!earnedIds.includes("lens_hero") && completedTeams.filter(t => {
    const hunt = hunts.find(h => h.id === t.huntId);
    return hunt?.huntType === "photography";
  }).length >=3) {
    newIds.push("lens_hero");
  }
  
  if (!earnedIds.includes("type_collector") && completedHuntTypes.size >=4) {
    newIds.push("type_collector");
  }
  
  return newIds;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hunts, setHunts] = useState<Hunt[]>(mockHunts);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [userAchievements, setUserAchievements] = useState<Record<string, UserAchievement[]>>(mockUserAchievements);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await fetchAPI<{ user: User }>('/api/v1/auth/me');
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await fetchAPI<{ user: User }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setCurrentUser(data.user);
    } catch (error) {
      console.error("Login failed, falling back to mock", error);
      const mockUser = mockUsers.find(u => u.email === email) || mockUsers[0];
      setCurrentUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: Role) => {
    setIsLoading(true);
    try {
      const data = await fetchAPI<{ user: User }>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      setCurrentUser(data.user);
    } catch (error) {
      console.error("Signup failed, falling back to mock", error);
      const newUser: User = {
        id: `u-${Date.now()}`,
        name,
        email,
        role,
      };
      setCurrentUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetchAPI('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
    }
  };

  const fetchHunts = async (filters?: { difficulty?: string; locationTag?: string; search?: string }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.difficulty) params.set('difficulty', filters.difficulty);
      if (filters?.locationTag) params.set('locationTag', filters.locationTag);
      if (filters?.search) params.set('search', filters.search);

      const data = await fetchAPI<Hunt[]>(`/api/v1/hunts?${params.toString()}`);
      setHunts(data);
    } catch (error) {
      console.error("Fetch hunts failed, using mock", error);
      setHunts(mockHunts.filter(h => {
        if (filters?.difficulty && h.difficulty !== filters.difficulty) return false;
        if (filters?.locationTag && h.locationTag !== filters.locationTag) return false;
        if (filters?.search && !h.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      }));
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
      currentUser, setCurrentUser, hunts, setHunts, teams, setTeams, users: mockUsers,
      userAchievements, setUserAchievements, awardAchievements, sendMessage,
      login, signup, logout, fetchHunts, isLoading
    }}>
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
