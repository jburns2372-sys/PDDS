"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import PddsLogo from "@/components/icons/pdds-logo";

const KARTILYA_POINTS = [
  "Kristyanong makabayan",
  "Batas at katarungan",
  "Kapakanan ng kapwa bago ang sarili",
  "Malayang Bayan, malusog na sambayanan, malinis na kapaligiran",
  "Itigil ang korapsyon, droga, at krimen",
];

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
      <div className="mb-8 flex items-center gap-4">
        <PddsLogo className="h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tighter text-primary font-headline">
          PDDS Portal
        </h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-headline">Preamble & Kartilya</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full pr-4">
            <div className="space-y-6">
              <p className="text-center font-bold text-lg text-primary/90">
                SA PANGINOONG HESUS AKO AY NANANALIG.
              </p>
              <ol className="list-inside list-decimal space-y-3 text-muted-foreground">
                {KARTILYA_POINTS.map((point, index) => (
                  <li key={index} className="pl-2">{point}</li>
                ))}
              </ol>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
            <Link href="/home">I Agree / Nananalig Ako</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
