import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Settings, Play, Archive, MoreVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { SoloModeBadge } from "@/components/SoloModeBadge";

export default function CreatorDashboard() {
  const { hunts, setHunts, currentUser } = useAppContext();
  const [, setLocation] = useLocation();
  const [copiedHuntId, setCopiedHuntId] = useState<string | null>(null);

  if (!currentUser || (currentUser.role !== "creator" && currentUser.role !== "both")) {
    setLocation("/");
    return null;
  }

  const myHunts = hunts.filter(h => h.creatorId === currentUser.id);
  const activeHunts = myHunts.filter(h => h.status !== "archived");
  const archivedHunts = myHunts.filter(h => h.status === "archived");

  const handleStatusChange = (huntId: string, newStatus: "published" | "archived" | "draft") => {
    setHunts(hunts.map(h => h.id === huntId ? { ...h, status: newStatus } : h));
  };

  const HuntRow = ({ hunt }: { hunt: any }) => (
    <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${hunt.status === 'archived' ? 'opacity-60 bg-muted/30' : 'bg-card hover:shadow-md'}`}>
      <div className="space-y-1 flex-grow">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg">{hunt.title}</h3>
          {hunt.gameMode === "solo" && <SoloModeBadge />}
          <Badge variant={hunt.status === 'published' ? 'default' : hunt.status === 'draft' ? 'secondary' : 'outline'}>
            {hunt.status.charAt(0).toUpperCase() + hunt.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{hunt.description}</p>
        <div className="flex gap-4 text-xs text-muted-foreground font-medium pt-1">
          <span>{hunt.clues.length} clues</span>
          <span>•</span>
          <span>{hunt.locationTag}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {hunt.gameMode === "solo" && (
          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 text-rose-600 hover:bg-rose-50"
            onClick={() => {
              const code = hunt.id.toUpperCase().slice(-2);
              navigator.clipboard.writeText(`SOLO-${code}`);
              setCopiedHuntId(hunt.id);
              setTimeout(() => setCopiedHuntId(null), 2000);
            }}
          >
            {copiedHuntId === hunt.id ? "Copied!" : "Copy Invite"}
          </Button>
        )}
        {hunt.status === 'draft' && (
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={hunt.clues.length < 2}
            onClick={() => handleStatusChange(hunt.id, 'published')}
          >
            <Play size={16} className="mr-2" /> Publish
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocation(`/hunts/edit/${hunt.id}`)}>
              <Settings size={16} className="mr-2" /> Edit Details
            </DropdownMenuItem>
            {hunt.status === 'published' && (
              <DropdownMenuItem onClick={() => setLocation(`/hunts/${hunt.id}/join`)}>
                <Eye size={16} className="mr-2" /> View Page
              </DropdownMenuItem>
            )}
            {hunt.status !== 'archived' && (
              <DropdownMenuItem onClick={() => handleStatusChange(hunt.id, 'archived')} className="text-destructive">
                <Archive size={16} className="mr-2" /> Archive
              </DropdownMenuItem>
            )}
            {hunt.status === 'archived' && (
              <DropdownMenuItem onClick={() => handleStatusChange(hunt.id, 'draft')}>
                Restore to Draft
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your adventures and track teams.</p>
        </div>
        <Link href="/hunts/new">
          <Button size="lg" className="shadow-md">
            <Plus size={20} className="mr-2" /> New Hunt
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Active Hunts
            <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">{activeHunts.length}</span>
          </h2>
          {activeHunts.length > 0 ? (
            <div className="space-y-4">
              {activeHunts.map(hunt => <HuntRow key={hunt.id} hunt={hunt} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
              <p className="text-muted-foreground mb-4">You haven't created any active hunts yet.</p>
              <Link href="/hunts/new">
                <Button variant="outline">Create Your First Hunt</Button>
              </Link>
            </div>
          )}
        </div>

        {archivedHunts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Archived</h2>
            <div className="space-y-4">
              {archivedHunts.map(hunt => <HuntRow key={hunt.id} hunt={hunt} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
