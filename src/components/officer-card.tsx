import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';

type OfficerCardProps = {
  role: string;
  name: string;
  avatarId: string;
};

export function OfficerCard({ role, name, avatarId }: OfficerCardProps) {
  const avatar = PlaceHolderImages.find(img => img.id === avatarId) as ImagePlaceholder;
  
  return (
    <Card className="overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <CardContent className="flex items-center gap-4 p-4">
        {avatar && (
          <Image
            src={avatar.imageUrl}
            alt={`Avatar for ${name}`}
            width={64}
            height={64}
            className="rounded-full border-2 border-accent"
            data-ai-hint={avatar.imageHint}
          />
        )}
        <div className="flex-1">
          <p className="font-bold text-sm text-primary">{role}</p>
          <p className="text-lg font-semibold">{name}</p>
        </div>
      </CardContent>
    </Card>
  );
}
