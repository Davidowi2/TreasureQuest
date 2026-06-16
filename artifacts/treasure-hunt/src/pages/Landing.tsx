import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Compass,
  Users,
  Map as MapIcon,
  Trophy,
  QrCode,
  Zap,
  ChevronRight,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
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
  const { currentUser } = useAppContext();
  const [, setLocation] = useLocation();
  const [joinCode, setJoinCode] = useState("");

  // Check for pin query param on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get("pin");
    if (pinParam) {
      setJoinCode(pinParam.toUpperCase());
    }
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      setLocation(`/hunts/${joinCode}/join`);
    }
  };

  const steps = [
    {
      icon: Users,
      title: "Host a Room",
      desc: "Instantly spin up a private hunt room and blast your unique Game PIN and QR code on a projector or screen.",
    },
    {
      icon: MapIcon,
      title: "Assemble the Crew",
      desc: "Players scan the code, create their teams, and step past the velvet rope into the live private lobby.",
    },
    {
      icon: Trophy,
      title: "The Scavenger Race",
      desc: "Teams hunt down real-world checkpoints, scan hidden physical QR codes, and race up the live leaderboards.",
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-background via-background to-muted/50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10"></div>
        </div>
        
        <div className="container px-4 mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight mb-6 text-foreground">
              Turn the Real World <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                into Your Playground
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Design epic scavenger hunts for your friends, or join existing adventures with just a Game PIN.
            </p>
          </motion.div>

          {/* Centered Join Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-2 border-primary/20 bg-card/60 backdrop-blur-xl shadow-2xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-bold">Have a Game PIN? Enter to Play</CardTitle>
                <CardDescription>Join a private adventure in seconds</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="join-code" className="text-lg">Enter Room Game PIN</Label>
                    <div className="flex gap-3">
                      <Input
                        id="join-code"
                        placeholder="TQ-7816"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="text-center text-2xl tracking-widest uppercase h-14 font-bold"
                        maxLength={10}
                      />
                      <Button type="submit" size="lg" className="h-14 px-8 text-xl font-bold">
                        Join Room <ChevronRight className="ml-2 h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </form>
                {!currentUser && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-muted-foreground mb-3">Ready to host your own adventure?</p>
                    <Link href="/signup">
                      <Button variant="outline" size="lg" className="w-full h-12 text-base font-semibold">
                        Get Started for Free
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get your scavenger hunt started in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <Card className="h-full border-2 bg-card/50 backdrop-blur">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-6">
                      <step.icon className="text-primary" size={40} />
                    </div>
                    <div className="text-5xl font-black text-primary mb-4">{idx + 1}</div>
                    <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground text-lg">
                    {step.desc}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Trust Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Private & Secure</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your adventures are completely private and protected
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 bg-card/50 backdrop-blur">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="text-primary" size={32} />
                </div>
                <CardTitle className="text-xl font-bold">Private Coordinates</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Rooms are locked by default. No public searching, no data sniffing—your event, your people, completely secure.
              </CardContent>
            </Card>

            <Card className="border-2 bg-card/50 backdrop-blur">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="text-accent" size={32} />
                </div>
                <CardTitle className="text-xl font-bold">Instant Handshake</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                One-click Google OAuth integration for frictionless signup and secure authentication.
              </CardContent>
            </Card>
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
