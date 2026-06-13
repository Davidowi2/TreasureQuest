import React from "react";
import { Link, useLocation } from "wouter";
import { Compass, Menu, Trophy, X } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { currentUser, setCurrentUser, userAchievements } = useAppContext();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsOpen(false);
  };

  const navLinks = () => {
    if (!currentUser) {
      return (
        <>
          <Link href="/hunts" className="text-sm font-medium hover:text-primary transition-colors">Browse Hunts</Link>
          <Link href="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors">Leaderboard</Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
          <Link href="/signup">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
          </Link>
        </>
      );
    }

    return (
      <>
        <Link href="/hunts" className="text-sm font-medium hover:text-primary transition-colors">Browse Hunts</Link>
        <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
        <Link href="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors">Leaderboard</Link>
        {(currentUser.role === "creator" || currentUser.role === "both") && (
          <Link href="/dashboard/creator" className="text-sm font-medium hover:text-primary transition-colors">My Hunts</Link>
        )}
        {(currentUser.role === "player" || currentUser.role === "both") && (
          <Link href="/dashboard/player" className="text-sm font-medium hover:text-primary transition-colors">My Teams</Link>
        )}
        <Link href="/achievements" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
          <Trophy size={15} className="text-accent" />
          <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-bold">
            {(userAchievements[currentUser.id] || []).length}
          </span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sm font-medium text-muted-foreground hover:text-foreground">Logout</Button>
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform">
            <Compass size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">TreasureQuest</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks()}
        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b shadow-lg p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-4" onClick={() => setIsOpen(false)}>
            {navLinks()}
          </div>
        </div>
      )}
    </nav>
  );
}
