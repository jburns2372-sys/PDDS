"use client";

import { useUserData } from "@/context/user-data-context";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hexagon, ShieldAlert, MapPin, Loader2, Sparkles, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * @fileOverview PatriotHub Digital Strategy Center.
 * Unified Global room ensures all members, admins, and officers see and participate in the same discussion.
 */
export default function ChatPage() {
  const { userData, loading } = useUserData();

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Establishing Connection to PatriotHub...</p>
        </div>
      </div>
    );
  }

  // Security Gate: Check for Vetting Status
  if (userData && !userData.isVerified) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-8 mt-12">
        <Card className="border-t-4 border-t-amber-500 shadow-2xl overflow-hidden bg-white">
          <CardHeader className="bg-amber-50/50 pb-6">
            <div className="bg-amber-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <ShieldAlert className="text-white h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-headline text-primary uppercase">PatriotHub Access Denied</CardTitle>
            <CardDescription className="text-sm font-medium leading-relaxed">
              To ensure the operational security of the movement, **PatriotHub** is restricted to verified personnel only.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-sm font-medium text-muted-foreground italic border-primary/20">
              "Private coordination requires verified identities. Once your profile is vetted by the Secretary General, your jurisdictional hub will be provisioned."
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-600">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Complete your verification via the Profile Page.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Set to unified Global room as requested
  const roomName = "National Hub";
  const cityTag = "National Strategy Command";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-[#f1f5f9]">
      <div className="bg-primary p-4 md:p-6 shadow-2xl shrink-0 relative overflow-hidden">
        {/* Intelligence Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <Network className="h-64 w-64 absolute -right-10 -top-10 text-white" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent text-primary rounded-xl shadow-2xl animate-pulse">
              <Hexagon className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline text-white uppercase tracking-tight leading-none">
                PatriotHub
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="bg-white/10 text-accent font-black text-[9px] uppercase border-none">
                  <MapPin className="h-2.5 w-2.5 mr-1" />
                  {cityTag}
                </Badge>
                <Badge className="bg-green-600 text-white font-black text-[9px] uppercase border-none">Secure Link</Badge>
              </div>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Encryption Status</p>
            <p className="text-xs font-bold text-green-400 uppercase tracking-widest">ACTIVE & SECURE</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface roomName={roomName} />
      </div>
    </div>
  );
}
