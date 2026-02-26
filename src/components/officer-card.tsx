import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';

type OfficerCardProps = {
  role: string;
  name: string;
  avatarId?: string;
  avatarUrl?: string;
};

export function OfficerCard({ role, name, avatarId, avatarUrl }: OfficerCardProps) {
  // If avatarUrl is provided (from Firestore), use it with Avatar component
  // Otherwise, use the placeholder image system
  const placeholderAvatar = avatarId ? PlaceHolderImages.find(img => img.id === avatarId) as ImagePlaceholder : null;
  
  return (
    <Card className="overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <CardContent className="flex items-center gap-4 p-4">
        {avatarUrl ? (
          <Avatar className="h-16 w-16 border-2 border-accent">
            <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : placeholderAvatar ? (
          <Image
            src={placeholderAvatar.imageUrl}
            alt={`Avatar for ${name}`}
            width={64}
            height={64}
            className="rounded-full border-2 border-accent h-16 w-16 object-cover"
            data-ai-hint={placeholderAvatar.imageHint}
          />
        ) : (
          <Avatar className="h-16 w-16 border-2 border-accent">
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <p className="font-bold text-sm text-primary">{role}</p>
          <p className="text-lg font-semibold">{name}</p>
        </div>
      </CardContent>
    </Card>
  );
}
