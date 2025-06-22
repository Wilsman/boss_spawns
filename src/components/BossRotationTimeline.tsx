import { BossEventConfig } from "@/types/bossEvents";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface BossRotationTimelineProps {
  events: BossEventConfig[];
  currentDate: Date;
}

export function BossRotationTimeline({ events, currentDate }: BossRotationTimelineProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sort events by start date (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  
  // Get only past events (excluding current)
  const pastEvents = sortedEvents.filter(event => {
    const end = new Date(new Date(event.startDate).getTime() + event.durationSeconds * 1000);
    return end < currentDate;
  });


  return (
    <div className="mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Previous Boss Rotations</h3>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        
        {/* Full Timeline (collapsible) */}
        <CollapsibleContent className="">
          <div className="border-t pt-2">
            <div>
              {pastEvents.map((event) => {
                const startDate = new Date(event.startDate);
                const endDate = new Date(startDate.getTime() + event.durationSeconds * 1000);
                const isPast = endDate < currentDate;
                
                return (
                  <div 
                    key={event.id}
                    className={cn(
                      "text-sm px-2 rounded hover:bg-muted/30 transition-colors",
                      isPast && "opacity-70"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.bossNames.join(" & ")}</span>
                      <span className="text-muted-foreground text-xs">
                        {format(startDate, 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
