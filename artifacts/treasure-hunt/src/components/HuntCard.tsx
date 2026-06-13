import { MapPin, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { Hunt } from "@/context/AppContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "./DifficultyBadge";

interface HuntCardProps {
  hunt: Hunt;
}

export function HuntCard({ hunt }: HuntCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-200 border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <DifficultyBadge difficulty={hunt.difficulty} />
          <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <MapPin size={12} className="mr-1" />
            {hunt.locationTag}
          </div>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-1">{hunt.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {hunt.description}
        </p>
        <div className="flex items-center text-sm font-medium text-foreground">
          <UserIcon size={14} className="mr-2 text-primary" />
          By {hunt.creatorName}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/hunts/${hunt.id}/join`} className="w-full">
          <Button className="w-full font-semibold">Join Hunt</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
