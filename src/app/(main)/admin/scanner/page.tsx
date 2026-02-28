
"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QrCode, UserCheck, AlertTriangle, Loader2, Camera, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function EventScannerPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const { data: events, loading: eventsLoading } = useCollection('meeting_agendas');
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<any>(null);

  const handleScan = async (result: any) => {
    if (!result || !isScanning || !selectedEventId) return;
    
    // Stop scanning immediately to prevent double-hits
    setIsScanning(false);
    const scannedUid = result[0].rawValue;

    try {
      // 1. Verify User in Registry
      const userRef = doc(firestore, "users", scannedUid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast({
          variant: "destructive",
          title: "Invalid ID",
          description: "This QR code does not belong to a registered member.",
        });
        resumeScanningAfterDelay();
        return;
      }

      const memberData = userSnap.data();
      if (memberData.isApproved === false) {
        toast({
          variant: "destructive",
          title: "Access Revoked",
          description: "This member account has been suspended.",
        });
        resumeScanningAfterDelay();
        return;
      }

      // 2. Record Attendance
      await addDoc(collection(firestore, "attendance"), {
        eventId: selectedEventId,
        userId: scannedUid,
        scannedBy: currentUser?.uid || 'System',
        timestamp: serverTimestamp(),
      });

      // 3. Success Feedback
      setLastScanned(memberData);
      toast({
        title: "Check-In Success",
        description: `${memberData.fullName} has been verified for the event.`,
      });

      // Audio feedback (Browser safety may block initial attempts)
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
        audio.play().catch(() => {});
      } catch (e) {}

      resumeScanningAfterDelay();
    } catch (error: any) {
      console.error("Scan error:", error);
      toast({ variant: "destructive", title: "Scan Failed", description: error.message });
      resumeScanningAfterDelay();
    }
  };

  const resumeScanningAfterDelay = () => {
    setTimeout(() => {
      setIsScanning(true);
    }, 2500);
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-inner">
            <QrCode className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary font-headline uppercase tracking-tight">
              Event Access Key
            </h1>
            <p className="text-muted-foreground text-xs font-medium">Point camera at a member's Digital ID QR code.</p>
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Deployment Control
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Active Event</label>
              <Select onValueChange={setSelectedEventId} value={selectedEventId}>
                <SelectTrigger className="h-12 font-bold">
                  <SelectValue placeholder={eventsLoading ? "Loading Events..." : "Choose Event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => (
                    <SelectItem key={e.id} value={e.id} className="font-bold">{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedEventId && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800 leading-tight">
                  You must select an active event from the list above before the scanner can be authorized.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedEventId && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-primary/10">
              {isScanning ? (
                <Scanner 
                  onScan={handleScan}
                  allowMultiple={false}
                  constraints={{ facingMode: "environment" }}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />
              ) : (
                <div className="absolute inset-0 bg-primary/90 flex flex-col items-center justify-center text-white p-8 text-center space-y-4">
                  {lastScanned ? (
                    <>
                      <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-accent" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black uppercase">{lastScanned.fullName}</p>
                        <p className="text-[10px] font-black tracking-widest opacity-60">CHECKED IN SUCCESSFULLY</p>
                      </div>
                    </>
                  ) : (
                    <Loader2 className="h-12 w-12 animate-spin opacity-50" />
                  )}
                  <p className="text-xs font-bold animate-pulse">Syncing Registry...</p>
                </div>
              )}
              
              {/* Aim Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-[40px] border-black/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/50 rounded-xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-accent/50 animate-[ping_2s_infinite]" />
              </div>
            </div>

            {lastScanned && (
              <Card className="bg-white/50 backdrop-blur-sm border-dashed border-2">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center font-black text-primary">
                    {lastScanned.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-primary">{lastScanned.fullName}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{lastScanned.role} • {lastScanned.city}</p>
                  </div>
                  <Badge className="bg-green-600 font-black text-[8px] uppercase">VERIFIED</Badge>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
