import { Camera, Brain, Lightbulb, Map as MapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HuntTypeBadge({ type, className = "" }: { type: string, className?: string }) {
  switch (type) {
    case "photography":
      return <Badge className={`bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 font-semibold shadow-sm ${className}`}><Camera size={14} className="mr-1" /> Photography</Badge>;
    case "riddle":
      return <Badge className={`bg-violet-100 text-violet-800 hover:bg-violet-100 border-violet-200 font-semibold shadow-sm ${className}`}><Brain size={14} className="mr-1" /> Riddle</Badge>;
    case "trivia":
      return <Badge className={`bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 font-semibold shadow-sm ${className}`}><Lightbulb size={14} className="mr-1" /> Trivia</Badge>;
    case "exploration":
      return <Badge className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 font-semibold shadow-sm ${className}`}><MapIcon size={14} className="mr-1" /> Exploration</Badge>;
    default:
      return null;
  }
}
