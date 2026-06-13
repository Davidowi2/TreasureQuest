import { useState, useMemo } from "react";
import { Search, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppContext, Difficulty } from "@/context/AppContext";
import { HuntCard } from "@/components/HuntCard";
import { motion } from "framer-motion";

export default function HuntDiscovery() {
  const { hunts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const publishedHunts = hunts.filter(h => h.status === "published");

  const filteredHunts = useMemo(() => {
    return publishedHunts.filter(hunt => {
      const matchesSearch = hunt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            hunt.locationTag.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || hunt.difficulty === difficultyFilter;
      const matchesType = typeFilter === "all" || hunt.huntType === typeFilter;
      return matchesSearch && matchesDifficulty && matchesType;
    });
  }, [publishedHunts, searchTerm, difficultyFilter, typeFilter]);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Discover Your Next Adventure</h1>
          <p className="text-muted-foreground text-lg">Browse {publishedHunts.length} active hunts and start exploring.</p>
        </div>
      </div>

      <div className="bg-card border p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            placeholder="Search by title or location..." 
            className="pl-10 h-12 text-base bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48 flex-shrink-0">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="photography">Photography</SelectItem>
              <SelectItem value="riddle">Riddle</SelectItem>
              <SelectItem value="trivia">Trivia</SelectItem>
              <SelectItem value="exploration">Exploration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48 flex-shrink-0">
          <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val as any)}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="Any Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mb-6 flex justify-between items-center text-sm font-medium text-muted-foreground">
        <span>Showing {filteredHunts.length} hunts</span>
      </div>

      {filteredHunts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredHunts.map((hunt, i) => (
            <motion.div
              key={hunt.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <HuntCard hunt={hunt} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <Compass size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hunts found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We couldn't find any hunts matching your search criteria. Try adjusting your filters.
          </p>
          <Button variant="outline" onClick={() => { setSearchTerm(""); setDifficultyFilter("all"); setTypeFilter("all"); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
