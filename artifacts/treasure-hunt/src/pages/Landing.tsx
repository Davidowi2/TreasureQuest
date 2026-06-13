import { useEffect, useState, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Link } from "wouter";
import { Compass, Users, Map as MapIcon, Trophy, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { HuntCard } from "@/components/HuntCard";

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
  }, [inView, value]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function Landing() {
  const { hunts } = useAppContext();
  const featuredHunts = hunts.filter(h => h.status === "published").slice(0, 3);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-background to-muted/50">
        <div className="container px-4 mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6 text-sm font-medium">
              <Sparkles size={16} />
              <span>The Ultimate Digital Treasure Hunt</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground">
              Adventure Awaits <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Around Every Corner
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              Turn your city into a playground. Create epic treasure hunts for your friends, or team up to solve mysteries left by creators around the world.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/hunts">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                  Join a Hunt
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-2 hover:bg-muted">
                  Create a Hunt
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10" />
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

      {/* How it Works Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Whether you're building an adventure or playing one, TreasureQuest makes it simple.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
            {/* For Players */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
                  <Users size={32} />
                </div>
                <h3 className="text-2xl font-bold">For Players</h3>
              </div>
              <div className="space-y-6">
                {[
                  { icon: Compass, title: "Find a Hunt", desc: "Browse local hunts or enter a private invite code." },
                  { icon: Target, title: "Solve Clues", desc: "Follow hints, explore locations, and submit photos to advance." },
                  { icon: Trophy, title: "Compete", desc: "Race against the clock and other teams to the finish line." }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <step.icon size={20} className="text-primary" />
                        {step.title}
                      </h4>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* For Creators */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <MapIcon size={32} />
                </div>
                <h3 className="text-2xl font-bold">For Creators</h3>
              </div>
              <div className="space-y-6">
                {[
                  { icon: MapIcon, title: "Design the Route", desc: "Pick a location and map out your exciting adventure." },
                  { icon: Sparkles, title: "Craft Clues", desc: "Write tricky hints and set up photo verification points." },
                  { icon: Users, title: "Invite Teams", desc: "Share your invite code and watch teams race in real-time." }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <step.icon size={20} className="text-primary" />
                        {step.title}
                      </h4>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
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
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <Link href="/hunts" className="hover:text-foreground transition-colors">Browse Hunts</Link>
            <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TreasureQuest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
