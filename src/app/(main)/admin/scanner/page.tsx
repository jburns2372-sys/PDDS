"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QrCode, AlertTriangle, Loader2, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

/**
 * @fileOverview Secure Event Attendance Scanner.
 * Strictly restricted to leadership roles for mobilization tracking.
 */
export default function EventScannerPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const { data: events, loading: eventsLoading } = useCollection('meeting_agendas');
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null);

  const handleScan = async (result: any) => {
    if (!result || !isScanning || !selectedEventId) return;
    
    setIsScanning(false);
    const scannedUid = result[0].rawValue;

    try {
      // 1. Verify User
      const userRef = doc(firestore, "users", scannedUid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setScanStatus('error');
        toast({ variant: "destructive", title: "Invalid ID", description: "Not found in registry." });
        resumeScanning();
        return;
      }

      const memberData = userSnap.data();
      if (memberData.isApproved === false) {
        setScanStatus('error');
        toast({ variant: "destructive", title: "Access Revoked", description: "Account suspended." });
        resumeScanning();
        return;
      }

      // 2. Record Attendance
      await addDoc(collection(firestore, "attendance"), {
        eventId: selectedEventId,
        userId: scannedUid,
        scannedBy: currentUser?.uid || 'System',
        timestamp: serverTimestamp(),
      });

      // 3. Feedback
      setLastScanned(memberData);
      setScanStatus('success');
      toast({ title: "Verified", description: `${memberData.fullName} checked in.` });

      resumeScanning();
    } catch (error: any) {
      setScanStatus('error');
      toast({ variant: "destructive", title: "Scan Failed", description: error.message });
      resumeScanning();
    }
  };

  const resumeScanning = () => {
    setTimeout(() => {
      setIsScanning(true);
      setScanStatus(null);
    }, 2500);
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-32">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-inner">
            <QrCode className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary font-headline uppercase tracking-tight">Access Control</h1>
            <p className="text-muted-foreground text-xs font-medium">Verify Digital ID Cards for Mobilization.</p>
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-primary overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              Event Synchronization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground">Select Deployment</label>
              <Select onValueChange={setSelectedEventId} value={selectedEventId}>
                <SelectTrigger className="h-12 font-bold"><SelectValue placeholder={eventsLoading ? "Loading..." : "Choose Event"} /></SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => <SelectItem key={e.id} value={e.id} className="font-bold">{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!selectedEventId && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800 leading-tight">Select an active event above to authorize the scanner.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedEventId && (
          <div className="space-y-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-primary/10">
              {isScanning ? (
                <Scanner 
                  onScan={handleScan}
                  allowMultiple={false}
                  constraints={{ facingMode: "environment" }}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />
              ) : (
                <div className={`absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center space-y-4 transition-colors ${scanStatus === 'success' ? 'bg-green-600/90' : 'bg-destructive/90'}`}>
                  {scanStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="h-20 w-20 animate-bounce" />
                      <div className="space-y-1">
                        <p className="text-xl font-black uppercase">{lastScanned?.fullName}</p>
                        <p className="text-[10px] font-black tracking-widest opacity-80 uppercase">Access Authorized</p>
                      </div>
                    </>
                  ) : scanStatus === 'error' ? (
                    <>
                      <XCircle className="h-20 w-20" />
                      <p className="text-xl font-black uppercase">Unauthorized</p>
                    </>
                  ) : (
                    <Loader2 className="h-12 w-12 animate-spin opacity-50" />
                  )}
                </div>
              )}
              
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/50 rounded-xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-accent/50 animate-pulse" />
              </div>
            </div>

            {lastScanned && scanStatus === 'success' && (
              <Card className="bg-white/50 backdrop-blur-sm border-dashed border-2 animate-in fade-in slide-in-from-top-2">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">
                    {lastScanned.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-primary leading-none">{lastScanned.fullName}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{lastScanned.role} • {lastScanned.city}</p>
                  </div>
                  <Badge className="bg-green-600 font-black text-[8px]">VERIFIED</Badge>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
