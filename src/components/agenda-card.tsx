"use client";

import type { Agenda } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Gavel, HeartHandshake, Landmark, Scale, Shield, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Gavel,
  Landmark,
  Scale,
  Shield,
  HeartHandshake,
};

export function AgendaCard({ agenda }: { agenda: Agenda }) {
  const Icon = iconMap[agenda.icon];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group flex h-full cursor-pointer flex-col items-center justify-center text-center transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-lg">
          <CardHeader>
            <div className="mx-auto rounded-full bg-primary/10 p-4 group-hover:bg-primary-foreground/20">
              {Icon && <Icon className="h-10 w-10 text-primary group-hover:text-primary-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg font-semibold font-headline">{agenda.title}</CardTitle>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-headline">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            {agenda.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {agenda.details.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
