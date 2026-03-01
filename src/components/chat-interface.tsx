
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
import { Send, Shield, Trash2, AlertCircle, Loader2, UserCheck, Flag } from "lucide-react";
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

  // Moderator Check: Coordinators can moderate their own city's chat
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
      toast({ variant: "destructive", title: "Message Failed", description: error.message });
    } finally {
      setSending(false);
    }
  };

  const handlePruneMessage = async (msgId: string) => {
    if (!canPrune) return;
    try {
      const msgRef = doc(firestore, "chat_rooms", roomName, "messages", msgId);
      await deleteDoc(msgRef);
      toast({ title: "Message Pruned" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Pruning Failed", description: error.message });
    }
  };

  const handleReportMessage = async (msgId: string) => {
    try {
      const msgRef = doc(firestore, "chat_rooms", roomName, "messages", msgId);
      await updateDoc(msgRef, { isReported: true });
      toast({ title: "Report Submitted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Establishing Tactical Link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/10">
                <Shield className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-xs font-black uppercase text-primary/40 tracking-[0.2em]">
                Secure Mobilization Channel
              </p>
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
                <Avatar className="h-9 w-9 shrink-0 border border-primary/10 shadow-sm">
                  <AvatarImage src={msg.senderPhoto} />
                  <AvatarFallback className="font-bold text-xs">{msg.senderName?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-black uppercase tracking-tight text-primary leading-none">
                      {msg.senderName}
                    </span>
                    <Badge className={`${vettingColor} h-3.5 px-1.5 text-[7px] font-black uppercase border-none`}>
                      {msg.senderVetting}
                    </Badge>
                  </div>

                  <div className={`relative p-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                    isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-muted/50 text-foreground rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.isReported && (
                      <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center gap-1.5 text-[8px] font-black uppercase text-red-500">
                        <AlertCircle className="h-2.5 w-2.5" /> Under Audit
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 px-1 mt-0.5">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">
                      {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                    
                    {!isMe && (
                      <button onClick={() => handleReportMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground hover:text-red-500">
                        <Flag className="h-2 w-2" />
                      </button>
                    )}

                    {canPrune && (
                      <button onClick={() => handlePruneMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-black uppercase text-red-600">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message chapter..."
            className="h-12 rounded-xl bg-[#f8fafc] border-primary/10"
            disabled={sending}
          />
          <Button 
            type="submit" 
            className="h-12 w-12 rounded-xl bg-primary shadow-lg shrink-0"
            disabled={!inputText.trim() || sending}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
