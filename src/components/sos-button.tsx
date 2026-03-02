
"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Loader2, ShieldAlert, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PddsLogo from "./icons/pdds-logo";

/**
 * @fileOverview SOS Distress Button.
 * Features the official logo as a semi-transparent background texture for high urgency.
 */
export function SOSButton() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleSOS = async () => {
    if (!user || !userData) return;
    setIsBroadcasting(true);
    
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Error" });
      setIsBroadcasting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await addDoc(collection(firestore, "sos_alerts"), {
            uid: user.uid,
            name: userData.fullName || "Member in Distress",
            phoneNumber: userData.phoneNumber || "Not provided",
            location: { lat: position.coords.latitude, lng: position.coords.longitude },
            status: "Active",
            timestamp: serverTimestamp(),
            message: "DISTRESS SIGNAL: Requesting immediate community assistance via Bayanihan Network."
          });
          toast({ title: "SOS BROADCASTED", variant: "destructive" });
        } catch (error: any) {
          toast({ variant: "destructive", title: "Broadcast Failed" });
        } finally {
          setIsBroadcasting(false);
        }
      },
      () => {
        toast({ variant: "destructive", title: "Location Denied" });
        setIsBroadcasting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full h-20 text-xl font-black uppercase tracking-[0.2em] shadow-2xl rounded-2xl animate-pulse group relative overflow-hidden"
          disabled={isBroadcasting}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <PddsLogo className="w-full h-full scale-150 grayscale brightness-200" />
          </div>
          <ShieldAlert className="mr-3 h-8 w-8 text-white relative z-10" />
          <span className="relative z-10">SOS Signal</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-red-50 border-red-200 overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <PddsLogo className="scale-[2.5]" />
        </div>
        <AlertDialogHeader className="relative z-10">
          <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl">
            <AlertCircle className="text-white h-10 w-10" />
          </div>
          <AlertDialogTitle className="text-2xl font-black text-red-700 text-center uppercase font-headline">Trigger Emergency Signal?</AlertDialogTitle>
          <AlertDialogDescription className="text-center font-bold text-red-900 leading-relaxed">
            This will broadcast your GPS location to all **Coordinators** and **Gold-Tier Patriots** within a 5km radius.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 relative z-10">
          <AlertDialogCancel className="h-12 font-black uppercase text-xs tracking-widest border-2">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSOS}
            className="h-12 font-black uppercase text-xs tracking-widest bg-red-600 hover:bg-red-700 shadow-xl"
          >
            {isBroadcasting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
            Confirm & Broadcast
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
