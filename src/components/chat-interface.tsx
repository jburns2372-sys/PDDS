
"use client";

import { useState, useEffect, useRef } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Shield, Trash2, AlertCircle, Loader2, UserCheck, Flag, Lock, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
};

/**
 * @fileOverview High-fidelity Real-time Comms Interface.
 * Implements jurisdictional routing and moderator tools for Coordinators.
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
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Verification & Moderation Logic
  const isVerified = userData?.isVerified === true;
  const isMuted = userData?.isMuted === true;
  const isModerator = userData?.role === 'Coordinator' && userData?.city === roomName;
  const isExecutive = ['President', 'Admin', 'System Admin'].includes(userData?.role || '');
  const canPrune = isModerator || isExecutive;

  useEffect(() => {
    if (!firestore || !roomName) return;

    setLoading(true);
    const messagesRef = collection(firestore, "chat_rooms", roomName, "messages");
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
      console.error("Chat sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, roomName]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !userData || sending) return;

    if (!isVerified) {
      toast({ variant: "destructive", title: "Access Restricted", description: "Only verified members can send messages." });
      return;
    }

    if (isMuted) {
      toast({ variant: "destructive", title: "Account Restricted", description: "You have been temporarily muted for conduct review." });
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
      const messagesRef = collection(firestore, "chat_rooms", roomName, "messages");
      await addDoc(messagesRef, messageData);
      setInputText("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Transmission Failed", description: error.message });
    } finally {
      setSending(false);
    }
  };

  const handlePruneMessage = async (msgId: string) => {
    if (!canPrune) return;
    if (!confirm("Prune this message from the Digital Town Square?")) return;
    
    try {
      const msgRef = doc(firestore, "chat_rooms", roomName, "messages", msgId);
      await deleteDoc(msgRef);
      toast({ title: "Signal Pruned" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Denied", description: "Moderator permissions required." });
    }
  };

  const handleReportMessage = async (msgId: string) => {
    try {
      const msgRef = doc(firestore, "chat_rooms", roomName, "messages", msgId);
      await updateDoc(msgRef, { isReported: true });
      toast({ title: "Audit Flagged", description: "Moderators have been notified." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Report Failed", description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Synchronizing Chapter Link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-primary/10">
                <Shield className="h-10 w-10 text-primary/20" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase text-primary tracking-[0.1em]">
                  {roomName} Digital Strategy Hub
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Verified Signal Active</p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderUid === user?.uid;
            const vettingColor = 
              msg.senderVetting === 'Gold' ? 'bg-yellow-500' : 
              msg.senderVetting === 'Silver' ? 'bg-slate-400' : 
              'bg-amber-700';

            return (
              <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-10 w-10 shrink-0 border-2 border-white shadow-sm">
                  <AvatarImage src={msg.senderPhoto} />
                  <AvatarFallback className="font-black text-xs bg-muted text-muted-foreground">{msg.senderName?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-black uppercase tracking-tight text-primary leading-none">
                      {msg.senderName}
                    </span>
                    <Badge className={`${vettingColor} h-3.5 px-1.5 text-[7px] font-black uppercase border-none text-white`}>
                      {msg.senderVetting}
                    </Badge>
                  </div>

                  <div className={`relative p-3.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm border ${
                    isMe ? 'bg-primary text-white border-primary rounded-tr-none' : 'bg-white text-foreground border-muted rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.isReported && (
                      <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-[8px] font-black uppercase text-red-500 animate-pulse">
                        <ShieldAlert className="h-2.5 w-2.5" /> Under Audit
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 px-1 mt-0.5">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">
                      {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'Connecting...'}
                    </span>
                    
                    {!isMe && (
                      <button onClick={() => handleReportMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground hover:text-red-500">
                        <Flag className="h-2.5 w-2.5" /> Report
                      </button>
                    )}

                    {canPrune && (
                      <button onClick={() => handlePruneMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black uppercase text-red-600 hover:text-red-700">
                        <Trash2 className="h-2.5 w-2.5" /> Prune
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} className="h-2" />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t shrink-0">
        {!isVerified ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-[10px] font-bold text-amber-800 uppercase leading-snug">
              Chat restricted to **Verified Members**. Complete your vetting with the Secretary General to participate.
            </p>
          </div>
        ) : isMuted ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-[10px] font-bold text-red-800 uppercase leading-snug">
              Your transmission rights have been suspended by Field Moderators for conduct review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message to chapter..."
              className="h-14 rounded-2xl bg-[#f8fafc] border-primary/10 shadow-inner focus-visible:ring-primary"
              disabled={sending}
            />
            <Button 
              type="submit" 
              className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shrink-0"
              disabled={!inputText.trim() || sending}
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
