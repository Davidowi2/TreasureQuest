import { Difficulty } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  switch (difficulty) {
    case "easy":
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 font-semibold shadow-sm">Easy</Badge>;
    case "medium":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 font-semibold shadow-sm">Medium</Badge>;
    case "hard":
      return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200 font-semibold shadow-sm">Hard</Badge>;
  }
}
