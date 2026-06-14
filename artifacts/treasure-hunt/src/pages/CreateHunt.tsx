import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Save, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Play, Plus, Mic, Type, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext, Difficulty, Hunt, Clue, ClueType } from "@/context/AppContext";

export default function CreateHunt() {
  const [, setLocation] = useLocation();
  const { currentUser, hunts, setHunts } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [locationTag, setLocationTag] = useState("");
  const [isShuffled, setIsShuffled] = useState(false);
  const [gameMode, setGameMode] = useState<"team" | "solo">("team");
  const [clues, setClues] = useState<Omit<Clue, "id" | "huntId">[]>([]);
  const [error, setError] = useState("");

  if (!currentUser) return null;

  const addClue = () => {
    setClues([...clues, { order: clues.length + 1, hint: "", hintUnlockText: "", clueType: "text" }]);
  };

  const updateClue = (index: number, field: keyof Clue, value: string) => {
    const newClues = [...clues];
    newClues[index] = { ...newClues[index], [field]: value } as any;
    setClues(newClues);
  };

  const removeClue = (index: number) => {
    const newClues = clues.filter((_, i) => i !== index);
    // Reorder
    newClues.forEach((c, i) => c.order = i + 1);
    setClues(newClues);
  };

  const moveClue = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === clues.length - 1)) return;
    
    const newClues = [...clues];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newClues[index];
    newClues[index] = newClues[targetIndex];
    newClues[targetIndex] = temp;
    
    // Reorder
    newClues.forEach((c, i) => c.order = i + 1);
    setClues(newClues);
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!title || !description || !locationTag) {
        setError("Please fill out all hunt details.");
        return;
      }
      if (clues.length === 0) addClue();
      setStep(2);
    } else if (step === 2) {
      if (clues.length < 2) {
        setError("You need at least 2 clues for a hunt.");
        return;
      }
      if (clues.some(c => !c.hint.trim() || !c.hintUnlockText.trim())) {
        setError("Please fill out hint and unlock text for all clues.");
        return;
      }
      setStep(3);
    }
  };

  const handleSave = (status: "draft" | "published") => {
    const newHunt: Hunt = {
      id: `h${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      title,
      description,
      difficulty,
      locationTag,
      status,
      isShuffled,
      createdAt: new Date().toISOString(),
      gameMode: gameMode,
      clues: clues.map((c, i) => ({
        ...c,
        id: `c${Date.now()}-${i}`,
        huntId: `h${Date.now()}` // technically referencing self but mock data is loose
      })) as Clue[],
      huntType: "exploration",
      minTeamSize: gameMode === "solo" ? 1 : 2,
      maxTeamSize: gameMode === "solo" ? 1 : 8,
      estimatedDuration: "30-45 min",
      totalPlayers: 0,
      completionRate: 0,
      rating: 0,
      ratingCount: 0
    };
    
    setHunts([newHunt, ...hunts]);
    setLocation("/dashboard/creator");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : setLocation("/dashboard/creator")}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Hunt</h1>
          <p className="text-muted-foreground">Step {step} of 3</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm bg-destructive/10 text-destructive rounded-xl font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Hunt Title</Label>
                <Input id="title" placeholder="e.g. The Lost City Gold" value={title} onChange={e => setTitle(e.target.value)} className="h-12" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the adventure to potential players..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={v => setDifficulty(v as Difficulty)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy - Good for kids/families</SelectItem>
                      <SelectItem value="medium">Medium - Standard challenge</SelectItem>
                      <SelectItem value="hard">Hard - For puzzle veterans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">General Location</Label>
                  <Input id="location" placeholder="e.g. Central Park" value={locationTag} onChange={e => setLocationTag(e.target.value)} className="h-12" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Game Mode</Label>
                  <p className="text-sm text-muted-foreground">Solo: for one invited player, starts immediately.</p>
                </div>
                <div className="flex gap-2">
                  {(["team", "solo"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGameMode(mode)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize ${
                        gameMode === mode
                          ? mode === "solo"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base">Shuffle Clues</Label>
                  <p className="text-sm text-muted-foreground">Players receive clues in a random order.</p>
                </div>
                <Switch checked={isShuffled} onCheckedChange={setIsShuffled} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleNext} size="lg" className="px-8">
              Next: Add Clues <ArrowRight className="ml-2" size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border">
            <span className="font-medium">{clues.length} Clues Added (Min 2)</span>
            <Button variant="outline" onClick={addClue} size="sm">
              <Plus className="mr-2" size={16} /> Add Clue
            </Button>
          </div>

          <div className="space-y-4">
            {clues.map((clue, index) => (
              <Card key={index} className="relative group border-border">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveClue(index, 'up')} disabled={index === 0}>
                      <ArrowUp size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveClue(index, 'down')} disabled={index === clues.length - 1}>
                      <ArrowDown size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeClue(index)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  
                  <div className="mb-4 font-bold text-primary">Clue {index + 1}</div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2 mb-4">
                      <Label className="mb-2 block">Clue Type</Label>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant={clue.clueType === "text" ? "default" : "outline"} 
                          size="sm" 
                          className="rounded-full flex-1"
                          onClick={() => updateClue(index, "clueType", "text")}
                        >
                          <Type size={14} className="mr-2" /> Text
                        </Button>
                        <Button 
                          type="button" 
                          variant={clue.clueType === "image" ? "default" : "outline"} 
                          size="sm" 
                          className="rounded-full flex-1"
                          onClick={() => updateClue(index, "clueType", "image")}
                        >
                          <ImageIcon size={14} className="mr-2" /> Image
                        </Button>
                        <Button 
                          type="button" 
                          variant={clue.clueType === "audio" ? "default" : "outline"} 
                          size="sm" 
                          className="rounded-full flex-1"
                          onClick={() => updateClue(index, "clueType", "audio")}
                        >
                          <Mic size={14} className="mr-2" /> Audio
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Hint</Label>
                      <Textarea 
                        placeholder="e.g. Find the oldest tree in the park..." 
                        value={clue.hint}
                        onChange={e => updateClue(index, "hint", e.target.value)}
                        className="resize-none"
                      />
                    </div>
                    
                    {clue.clueType === "image" && (
                      <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors">
                        <ImageIcon size={24} className="text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">Upload clue image</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        <input type="file" accept="image/*" className="sr-only" />
                      </div>
                    )}

                    {clue.clueType === "audio" && (
                      <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors">
                        <Mic size={24} className="text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">Upload audio clue</p>
                        <p className="text-xs text-muted-foreground">MP3, WAV, M4A — max 10MB</p>
                        <input type="file" accept=".mp3,.wav,.m4a,audio/*" className="sr-only" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Unlock Text (Shown if players get stuck)</Label>
                      <Input 
                        placeholder="e.g. It's the large oak near the north entrance." 
                        value={clue.hintUnlockText}
                        onChange={e => updateClue(index, "hintUnlockText", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleNext} size="lg" className="px-8">
              Review & Publish <ArrowRight className="ml-2" size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="border-border shadow-md">
            <CardContent className="p-8 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">{title}</h2>
                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                  <span className="capitalize">{difficulty}</span> • 
                  <span>{locationTag}</span> • 
                  <span>{clues.length} Clues</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg">{description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Clue Preview</h3>
                <div className="space-y-3">
                  {clues.map((clue, i) => (
                    <div key={i} className="p-3 border rounded-lg flex gap-4">
                      <div className="font-bold text-primary w-6 pt-1">{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {clue.clueType === 'image' && <ImageIcon size={10} className="mr-1" />}
                            {clue.clueType === 'audio' && <Headphones size={10} className="mr-1" />}
                            {clue.clueType === 'text' && <Type size={10} className="mr-1" />}
                            {clue.clueType}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{clue.hint}</p>
                        <p className="text-xs text-muted-foreground mt-1">Unlock: {clue.hintUnlockText}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Button variant="ghost" onClick={() => setStep(2)} className="sm:mr-auto">Back to Edit</Button>
            <Button variant="outline" size="lg" onClick={() => handleSave("draft")}>
              <Save size={18} className="mr-2" /> Save as Draft
            </Button>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleSave("published")}>
              <Play size={18} className="mr-2" /> Publish Hunt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
