import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Compass,
  Users,
  Map as MapIcon,
  Trophy,
  Target,
  Sparkles,
  QrCode,
  Camera,
  Zap,
  ChevronRight,
  Gamepad2,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { HuntCard } from "@/components/HuntCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number, suffix?: string, prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (v) => setCount(Math.floor(v)),
      });
      return controls.stop;
    }
    return undefined;
  }, [inView, value]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function Landing() {
  const { hunts, currentUser } = useAppContext();
  const [, setLocation] = useLocation();
  const [joinCode, setJoinCode] = useState("");
  const featuredHunts = hunts.filter(h => h.status === "published").slice(0, 3);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      setLocation(`/hunts/${joinCode}/join`);
    }
  };

  const steps = [
    {
      icon: QrCode,
      title: "Scan & Team Up",
      desc: "Scan a QR code to join your friends or create a new team in seconds.",
    },
    {
      icon: MapIcon,
      title: "Decode the Clues",
      desc: "Solve riddles, find checkpoints, and piece together the mystery.",
    },
    {
      icon: Camera,
      title: "Snap Photo Proof",
      desc: "Capture photos to verify you're at each checkpoint. AI verifies instantly!",
    },
    {
      icon: Trophy,
      title: "Rule the Leaderboard",
      desc: "Race against other teams, climb the ranks, and claim your victory.",
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-background to-muted/50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10"></div>
        </div>
        
        <div className="container px-4 mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6 text-sm font-medium">
              <Sparkles size={16} />
              <span>The Ultimate Digital Treasure Hunt</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground">
              Adventure Awaits <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Around Every Corner
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Turn your city into a playground. Create epic treasure hunts for your friends, or team up to solve mysteries left by creators around the world.
            </p>
          </motion.div>

          {/* Split Onboarding Funnel */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-16">
            {/* For Players */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full border-2 border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Gamepad2 className="text-primary" size={24} />
                  </div>
                  <CardTitle className="text-2xl font-bold">Join an Adventure</CardTitle>
                  <CardDescription>Got an invite code? Jump right in!</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="join-code">Enter Invite Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="join-code"
                          placeholder="ABC123"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          className="text-center text-lg tracking-widest uppercase"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold">
                      Join Hunt <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* For Creators */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-2 border-accent/20 bg-card/50 backdrop-blur">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <PlusCircle className="text-accent" size={24} />
                  </div>
                  <CardTitle className="text-2xl font-bold">Create Your Own Hunt</CardTitle>
                  <CardDescription>Design a custom adventure for your community.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Build riddles, photo checkpoints, and interactive puzzles with our easy creator dashboard.
                    </p>
                    <Link href={currentUser ? "/hunts/new" : "/signup"}>
                      <Button variant="secondary" size="lg" className="w-full h-12 text-base font-semibold">
                        Start Creating <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="bg-foreground text-background py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-background/20">
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-4xl md:text-5xl font-bold text-primary">
                <AnimatedCounter value={2175} suffix="+" />
              </span>
              <span className="text-sm md:text-base font-medium opacity-80 uppercase tracking-wider">Adventurers</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-4xl md:text-5xl font-bold text-accent">
                <AnimatedCounter value={6} />
              </span>
              <span className="text-sm md:text-base font-medium opacity-80 uppercase tracking-wider">Active Hunts</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-4xl md:text-5xl font-bold text-emerald-400">
                <AnimatedCounter value={94} suffix="%" />
              </span>
              <span className="text-sm md:text-base font-medium opacity-80 uppercase tracking-wider">Completion Rate</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-4xl md:text-5xl font-bold text-violet-400">
                <AnimatedCounter value={18} suffix=" min" />
              </span>
              <span className="text-sm md:text-base font-medium opacity-80 uppercase tracking-wider">Avg Completion</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              It's simple to get started and endlessly fun to play!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full border-2 bg-card/50 backdrop-blur">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <step.icon className="text-primary" size={32} />
                    </div>
                    <div className="text-4xl font-bold text-muted-foreground mb-2">{idx + 1}</div>
                    <CardTitle className="text-xl font-bold">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground">
                    {step.desc}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hunts */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Adventures</h2>
              <p className="text-muted-foreground">Ready to start? Try one of our top-rated hunts.</p>
            </div>
            <Link href="/hunts">
              <Button variant="ghost" className="hidden sm:flex">View All Hunts</Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHunts.map((hunt, i) => (
              <motion.div
                key={hunt.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <HuntCard hunt={hunt} />
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/hunts">
              <Button variant="outline" className="w-full">View All Hunts</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background py-12">
        <div className="container px-4 mx-auto text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-xl">
            <Compass className="text-primary" />
            TreasureQuest
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground justify-center">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <Link href="/hunts" className="hover:text-foreground transition-colors">Browse Hunts</Link>
            <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TreasureQuest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
