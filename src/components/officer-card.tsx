import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

type OfficerCardProps = {
  role: string;
  name: string;
  avatarUrl?: string;
};

export function OfficerCard({ role, name, avatarUrl }: OfficerCardProps) {
  const isVacant = !name;

  return (
    <Card className="overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-16 w-16 border-2 border-accent">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
          <AvatarFallback className="bg-muted">
            {name ? name.charAt(0) : <UserCircle className="h-8 w-8 text-muted-foreground/40" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold text-sm text-primary uppercase tracking-tight">{role}</p>
          <p className={`text-lg font-semibold ${isVacant ? 'text-muted-foreground/50 italic' : 'text-foreground'}`}>
            {isVacant ? "Position Vacant" : name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
