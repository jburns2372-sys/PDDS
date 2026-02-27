"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type OfficerCardProps = {
  role: string;
  name: string;
  photoURL?: string;
  about?: string;
};

export function OfficerCard({ role, name, photoURL, about }: OfficerCardProps) {
  const isVacant = !name;

  const cardContent = (
    <Card className={`overflow-hidden transition-all duration-300 border-primary/10 ${isVacant ? 'bg-muted/5' : 'hover:scale-105 hover:shadow-xl hover:border-primary/30'}`}>
      <CardContent className="flex items-center gap-4 p-5 relative">
        {!isVacant && about && (
            <div className="absolute top-2 right-2 text-primary/30">
                <Info className="h-3 w-3" />
            </div>
        )}
        <Avatar className={`h-16 w-16 border-2 shadow-sm ${isVacant ? 'border-muted bg-muted/10' : 'border-accent bg-background'}`}>
          {photoURL && !isVacant ? (
            <AvatarImage src={photoURL} alt={name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-transparent">
            {isVacant ? (
              <UserCircle className="h-10 w-10 text-muted-foreground/10" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {name.charAt(0)}
              </span>
            )}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[10px] text-primary uppercase tracking-widest mb-1 opacity-70">
            {role}
          </p>
          <div className="h-7 flex items-center">
            {!isVacant && (
              <p className="text-lg font-bold text-foreground truncate leading-none">
                {name}
              </p>
            )}
            {isVacant && (
              <span className="text-xs text-muted-foreground/30 italic">Position Vacant</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isVacant && about) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            sideOffset={10}
            className="max-w-[450px] p-6 bg-primary text-primary-foreground border-none shadow-2xl z-50"
          >
            <div className="space-y-3">
                <div className="border-b border-primary-foreground/20 pb-2">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Officer Biography</p>
                    <h3 className="text-lg font-bold font-headline">{name}</h3>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {about}
                </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
