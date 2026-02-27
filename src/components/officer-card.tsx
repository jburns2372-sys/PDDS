
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

type OfficerCardProps = {
  role: string;
  name: string;
  photoURL?: string;
};

export function OfficerCard({ role, name, photoURL }: OfficerCardProps) {
  const isVacant = !name;

  return (
    <Card className={`overflow-hidden transition-all duration-300 border-primary/10 ${isVacant ? 'bg-muted/5' : 'hover:scale-105 hover:shadow-xl hover:border-primary/30'}`}>
      <CardContent className="flex items-center gap-4 p-5">
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
}
