
"use client";

import { useUserData } from "@/context/user-data-context";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle, ShieldAlert, MapPin, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * @fileOverview Digital Town Square Entry Point.
 * Automatically identifies the user's city and connects them to their jurisdictional room.
 */
export default function ChatPage() {
  const { userData, loading } = useUserData();

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Town Square...</p>
        </div>
      </div>
    );
  }

  // Security Gate: Check for Vetting Status
  if (userData && !userData.isVerified) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-8 mt-12">
        <Card className="border-t-4 border-t-amber-500 shadow-2xl overflow-hidden">
          <CardHeader className="bg-amber-50/50 pb-6">
            <div className="bg-amber-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <ShieldAlert className="text-white h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-headline text-primary uppercase">Identity Verification Required</CardTitle>
            <CardDescription className="text-sm font-medium leading-relaxed">
              To ensure the safety and integrity of the PDDS movement, the Town Square is exclusive to **Verified Members**.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 bg-muted rounded-lg border border-dashed text-sm font-medium text-muted-foreground italic">
              "Anonymous dialogue is the enemy of constructive nation-building. Once the Secretary General vets your profile, you will be granted access to your local mobilization hub."
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-600">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Contact your Regional Coordinator to fast-track your vetting.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roomName = userData?.city || "National Hub";
  const cityTag = userData?.city ? `${userData.city} Room` : "National Strategy Room";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      <div className="bg-card p-4 md:p-6 border-b shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary uppercase tracking-tight leading-none">
                Town Square
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground font-black text-[9px] uppercase">
                  <MapPin className="h-2.5 w-2.5 mr-1" />
                  {cityTag}
                </Badge>
                <Badge className="bg-green-600 text-white font-black text-[9px] uppercase">Verified Only</Badge>
              </div>
            </div>
          </div>
          <p className="text-[10px] md:text-xs font-medium text-muted-foreground max-w-xs italic leading-snug">
            "Direct mobilization and dialogue for {userData?.city || 'the whole nation'}. Keep it focused, keep it patriotic."
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#f8fafc]">
        <ChatInterface roomName={roomName} />
      </div>
    </div>
  );
}
