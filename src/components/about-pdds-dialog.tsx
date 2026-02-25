"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { pddsInfo } from "@/lib/data";
import { Info } from "lucide-react";
import React from "react";

export function AboutPddsDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-headline">
            <Info className="h-6 w-6 text-primary" />
            About PDDS
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-lg font-bold text-primary font-headline mb-2">Vision</h3>
              <p className="text-muted-foreground">{pddsInfo.vision}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-headline mb-2">Mission</h3>
              <p className="text-muted-foreground">{pddsInfo.mission}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-headline mb-2">Preamble</h3>
              <div className="space-y-3 text-muted-foreground">
                {pddsInfo.preamble.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-headline mb-2">Kartilya</h3>
              <ul className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {pddsInfo.kartilya.map((item, index) => (
                  <li key={index}>{item.replace(';', '')}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-headline mb-2">Program of Government</h3>
              <div className="space-y-4">
                {pddsInfo.program.map((section) => (
                  <div key={section.title}>
                    <h4 className="font-semibold text-foreground mb-1">{section.title}</h4>
                    <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                      {section.points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
