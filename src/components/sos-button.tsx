
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

/**
 * @fileOverview SOS Distress Button.
 * Captures geolocation and broadcasts a Bayanihan alert to nearby responders.
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
    
    // 1. Capture Precise Geolocation
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Error", description: "Geolocation is not supported by your browser." });
      setIsBroadcasting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const alertData = {
          uid: user.uid,
          name: userData.fullName || "Member in Distress",
          phoneNumber: userData.phoneNumber || "Not provided",
          location: { lat: latitude, lng: longitude },
          status: "Active",
          timestamp: serverTimestamp(),
          message: "DISTRESS SIGNAL: Requesting immediate community assistance via Bayanihan Network."
        };

        try {
          await addDoc(collection(firestore, "sos_alerts"), alertData);
          toast({ 
            title: "SOS BROADCASTED", 
            description: "Signal sent to nearby Coordinators and Gold-tier Patriots.",
            variant: "destructive"
          });
        } catch (error: any) {
          toast({ variant: "destructive", title: "Broadcast Failed", description: error.message });
        } finally {
          setIsBroadcasting(false);
        }
      },
      (error) => {
        toast({ variant: "destructive", title: "Location Denied", description: "Please enable location services to use SOS." });
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
          <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-1000 -skew-x-12" />
          <ShieldAlert className="mr-3 h-8 w-8 text-white" />
          SOS Signal
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-red-50 border-red-200">
        <AlertDialogHeader>
          <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl">
            <AlertCircle className="text-white h-10 w-10" />
          </div>
          <AlertDialogTitle className="text-2xl font-black text-red-700 text-center uppercase font-headline">Trigger Emergency Signal?</AlertDialogTitle>
          <AlertDialogDescription className="text-center font-bold text-red-900 leading-relaxed">
            This will broadcast your GPS location to all **Coordinators** and **Gold-Tier Patriots** within a 5km radius. Use only in situations of distress or immediate community need.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="h-12 font-black uppercase text-xs tracking-widest border-2">Cancel Signal</AlertDialogCancel>
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
