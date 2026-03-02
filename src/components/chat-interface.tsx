
"use client";

import { useState, useEffect, useRef } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Shield, Trash2, AlertCircle, Loader2, UserCheck, Flag, Lock, ShieldAlert, Hexagon, Pin, X, Sparkles, Trophy, Users, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import PddsLogo from "./icons/pdds-logo";

type Message = {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  senderRole: string;
  senderVetting: string;
  senderPhoto: string;
  timestamp: any;
  isReported?: boolean;
  isSystem?: boolean;
};

/**
 * @fileOverview PatriotHub Strategy Node Interface.
 * Implements jurisdictional routing, Global Pins, and the celebratory Genesis Onboarding.
 */
export function ChatInterface({ roomName }: { roomName: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userData } = useUserData();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Pin Data Stream
  const { data: globalPins } = useCollection('patriothub_pins', {
    queries: [{ attribute: 'isActive', operator: '==', value: true }]
  });

  // Verification & Moderation Logic
  const isVerified = userData?.isVerified === true;
  const isMuted = userData?.isMuted === true;
  const isModerator = userData?.role === 'Coordinator' && userData?.city === roomName;
  const isExecutive = ['President', 'Admin', 'System Admin'].includes(userData?.role || '');
  const canPrune = isModerator || isExecutive;

  useEffect(() => {
    // Check for first-time Genesis welcome
    const hasSeenGenesis = localStorage.getItem('patriothub_genesis_v1');
    if (!hasSeenGenesis) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    localStorage.setItem('patriothub_genesis_v1', 'true');
    setShowWelcome(false);
  };

  useEffect(() => {
    if (!firestore || !roomName) return;

    setLoading(true);
    const messagesRef = collection(firestore, "patriothub_rooms", roomName, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    }, (error) => {
      console.error("Hub sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, roomName]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user || !userData || sending) return;

    if (!isVerified) {
      toast({ variant: "destructive", title: "Access Restricted", description: "Only verified members can broadcast to the Hub." });
      return;
    }

    if (isMuted) {
      toast({ variant: "destructive", title: "Transmission Rights Revoked", description: "Your account is under conduct review." });
      return;
    }

    setSending(true);
    const messageData = {
      text: inputText.trim(),
      senderUid: user.uid,
      senderName: userData.fullName || "Member",
      senderRole: userData.role || "Member",
      senderVetting: userData.vettingLevel || "Bronze",
      senderPhoto: userData.photoURL || "",
      timestamp: serverTimestamp(),
      isReported: false
    };

    try {
      const messagesRef = collection(firestore, "patriothub_rooms", roomName, "messages");
      await addDoc(messagesRef, messageData);
      setInputText("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signal Lost", description: error.message });
    } finally {
      setSending(false);
    }
  };

  const handlePruneMessage = async (msgId: string) => {
    if (!canPrune) return;
    if (!confirm("Prune this signal from the Hub intelligence?")) return;
    
    try {
      const msgRef = doc(firestore, "patriothub_rooms", roomName, "messages", msgId);
      await deleteDoc(msgRef);
      toast({ title: "Signal Pruned" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Denied", description: "Moderator credentials required." });
    }
  };

  const handleReportMessage = async (msgId: string) => {
    try {
      const msgRef = doc(firestore, "patriothub_rooms", roomName, "messages", msgId);
      await updateDoc(msgRef, { isReported: true });
      toast({ title: "Signal Flagged", description: "Hub Moderators have been notified." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Audit Failed", description: error.message });
    }
  };

  const focusInput = () => {
    closeWelcome();
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Handshaking with Jurisdictional Node...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative">
      {/* GENESIS WELCOME OVERLAY */}
      {showWelcome && (
        <div className="absolute inset-0 z-50 bg-primary/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-xl w-full bg-white rounded-[32px] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Shield className="h-64 w-64 text-primary" />
            </div>
            
            <div className="p-8 md:p-12 space-y-8 relative z-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-accent p-4 rounded-3xl shadow-2xl animate-bounce">
                  <Hexagon className="h-10 w-10 text-primary fill-current" />
                </div>
                <h2 className="text-3xl font-black text-primary font-headline uppercase tracking-tighter">
                  PatriotHub is Live
                </h2>
                <div className="h-1 w-24 bg-accent rounded-full" />
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <Network className="h-5 w-5 text-accent shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-primary">Regional Power</p>
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">Direct connection to fellow Patriots in **{roomName}**.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-primary">Verified Only</p>
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">Zero noise. Only vetted members can broadcast here.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border-2 border-dashed space-y-4">
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed italic text-center">
                    "Your command center for localized action and national strategy."
                  </p>
                  <Button 
                    onClick={focusInput}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl rounded-xl"
                  >
                    <Sparkles className="mr-2 h-5 w-5 text-accent" />
                    Introduce Yourself
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 pt-4 border-t border-dashed">
                <PddsLogo className="h-8 w-8" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 italic">
                  Para sa Dugong Dakilang Samahan!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Pin Overlay */}
      {globalPins && globalPins.length > 0 && (
        <div className="bg-accent p-3 shadow-md border-b-2 border-primary/10 relative z-20 animate-in slide-in-from-top duration-500">
          {globalPins.map(pin => (
            <div key={pin.id} className="max-w-7xl mx-auto flex items-start gap-3">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                {pin.isSystem ? <Shield className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">
                  {pin.isSystem ? "EXECUTIVE COMMAND" : `Global Directive: ${pin.authorName}`}
                </p>
                <p className="text-xs font-bold text-primary leading-relaxed">{pin.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 px-4 md:px-6 py-6">
        <div className="space-y-8 pb-4">
          {messages.length === 0 && !loading && (
            <div className="py-24 text-center space-y-4">
              <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-primary/10 shadow-inner">
                <Hexagon className="h-12 w-12 text-primary/20" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black uppercase text-primary tracking-[0.15em]">
                  {roomName} Node Operational
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Jurisdictional Strategy Active</p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderUid === user?.uid;
            const isMod = msg.senderRole === 'Coordinator';
            const vettingColor = 
              msg.senderVetting === 'Gold' ? 'bg-yellow-500' : 
              msg.senderVetting === 'Silver' ? 'bg-slate-400' : 
              'bg-amber-700';

            return (
              <div key={msg.id} className={`flex gap-4 group ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-11 w-11 shrink-0 border-2 border-white shadow-xl group-hover:scale-105 transition-transform">
                  <AvatarImage src={msg.senderPhoto} />
                  <AvatarFallback className="font-black text-xs bg-muted text-muted-foreground">{msg.senderName?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isMod ? 'text-accent' : 'text-primary'}`}>
                      {msg.senderName} {isMod && " (Hub Moderator)"}
                    </span>
                    <Badge className={`${vettingColor} h-3.5 px-1.5 text-[7px] font-black uppercase border-none text-white shadow-sm`}>
                      {msg.senderVetting}
                    </Badge>
                  </div>

                  <div className={`relative p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-lg border-2 ${
                    isMe ? 'bg-primary text-white border-primary rounded-tr-none' : 'bg-white text-foreground border-white rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.isReported && (
                      <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-[8px] font-black uppercase text-red-500 animate-pulse">
                        <ShieldAlert className="h-2.5 w-2.5" /> Intelligence Audit Active
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 px-1 mt-0.5">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                      {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'Syncing...'}
                    </span>
                    
                    {!isMe && (
                      <button onClick={() => handleReportMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground hover:text-red-500">
                        <Flag className="h-2.5 w-2.5" /> Flag Signal
                      </button>
                    )}

                    {canPrune && (
                      <button onClick={() => handlePruneMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black uppercase text-red-600 hover:text-red-700">
                        <Trash2 className="h-2.5 w-2.5" /> Prune Signal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-primary/5 shadow-2xl relative z-10">
        {!isVerified ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 shadow-inner">
            <Lock className="h-6 w-6 text-amber-600 shrink-0" />
            <p className="text-[10px] font-bold text-amber-800 uppercase leading-snug">
              Broadcasting restricted to **Verified Personnel**. Complete your induction vetting to participate in regional strategy.
            </p>
          </div>
        ) : isMuted ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 shadow-inner">
            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
            <p className="text-[10px] font-bold text-red-800 uppercase leading-snug">
              Your transmission rights have been suspended by Hub Moderators for conduct review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-4 max-w-7xl mx-auto">
            <div className="relative flex-1">
              <Input 
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Broadcast jurisdictional strategy..."
                className="h-16 rounded-2xl bg-[#f1f5f9] border-none shadow-inner focus-visible:ring-primary pl-6 pr-12 text-sm font-bold placeholder:text-muted-foreground/50"
                disabled={sending}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary/20 uppercase tracking-widest hidden md:block">
                Secure Link
              </div>
            </div>
            <Button 
              type="submit" 
              className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shrink-0 group transition-all"
              disabled={!inputText.trim() || sending}
            >
              {sending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </Button>
          </form>
        )}
        <div className="mt-3 flex justify-center items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">Live Signal: {roomName} Node</span>
          </div>
          <div className="h-3 w-px bg-muted" />
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-primary opacity-20" />
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">End-to-End Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
