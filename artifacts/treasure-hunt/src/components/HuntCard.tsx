import { MapPin, User as UserIcon, Users, Clock, Star } from "lucide-react";
import { Link } from "wouter";
import { Hunt } from "@/context/AppContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "./DifficultyBadge";
import { HuntTypeBadge } from "./HuntTypeBadge";
import { SoloModeBadge } from "@/components/SoloModeBadge";

interface HuntCardProps {
  hunt: Hunt;
}

export function HuntCard({ hunt }: HuntCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-200 border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-wrap gap-2">
            <HuntTypeBadge type={hunt.huntType} />
            {hunt.gameMode === "solo" && <SoloModeBadge />}
            <DifficultyBadge difficulty={hunt.difficulty} />
          </div>
          <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap ml-2">
            <MapPin size={12} className="mr-1" />
            <span className="truncate max-w-[80px] sm:max-w-[100px]">{hunt.locationTag}</span>
          </div>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-1">{hunt.title}</CardTitle>
        {hunt.ratingCount > 0 && (
          <div className="flex items-center gap-1 mt-1 text-sm font-medium text-muted-foreground">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-foreground">{hunt.rating.toFixed(1)}</span>
            <span>({hunt.ratingCount})</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {hunt.description}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-primary" />
            <span>{hunt.totalPlayers} players</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            <span>{hunt.estimatedDuration}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-md font-medium">
            {hunt.minTeamSize}-{hunt.maxTeamSize} players
          </span>
          {hunt.timeLimit && (
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md font-medium">
              {hunt.timeLimit} min limit
            </span>
          )}
        </div>

        <div className="flex items-center text-sm font-medium text-foreground pt-2 border-t">
          <UserIcon size={14} className="mr-2 text-primary" />
          By {hunt.creatorName}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Link href={`/hunts/${hunt.id}`} className="w-1/2">
          <Button variant="outline" className="w-full font-semibold">View Hunt</Button>
        </Link>
        <Link href={`/hunts/${hunt.id}/join`} className="w-1/2">
          <Button className="w-full font-semibold">Join</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
