import { User } from "lucide-react";

export function SoloModeBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 ${className}`}>
      <User size={11} />
      Solo
    </span>
  );
}