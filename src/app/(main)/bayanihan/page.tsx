
"use client";

import { useUserData } from "@/context/user-data-context";
import { useCollection, useFirestore } from "@/firebase";
import { RescueMap } from "@/components/rescue-map";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, ShieldAlert, Loader2, Info, Activity, UserCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

/**
 * @fileOverview Bayanihan Network - Crisis Response Hub.
 * Optimized for Coordinators and Gold-Tier responders.
 */
export default function BayanihanPage() {
  const { userData, loading: userLoading } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: alerts, loading: alertsLoading } = useCollection('sos_alerts');

  const activeAlerts = useMemo(() => {
    return alerts.filter(a => a.status === 'Active')
      .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [alerts]);

  const resolvedAlerts = useMemo(() => {
    return alerts.filter(a => a.status === 'Resolved')
      .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [alerts]);

  const handleResolve = async (alertId: string) => {
    try {
      const alertRef = doc(firestore, 'sos_alerts', alertId);
      await updateDoc(alertRef, {
        status: "Resolved",
        resolvedBy: userData?.fullName || "A Patriot"
      });
      toast({ title: "Situation Resolved", description: "Bayanihan response logged in the registry." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    }
  };

  const isResponder = userData?.role === 'Coordinator' || userData?.vettingLevel === 'Gold' || userData?.role === 'President';

  if (userLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <div className="bg-card p-6 md:p-8 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-xl">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
                Bayanihan Network
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-red-100 text-red-700 font-black text-[10px] uppercase border-none">Crisis Management</Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase">Mutual Aid Engine</Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-2xl font-black text-red-600">{activeAlerts.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Active Alerts</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-green-600">{resolvedAlerts.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Aid Rendered</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {!isResponder && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-6 rounded-2xl flex items-start gap-4">
            <Info className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800 uppercase text-sm">Response Hub Access Restricted</h3>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                While you can see the National Rescue Map, only **Verified Coordinators** and **Gold-Tier Patriots** are authorized to manage and resolve crisis signals. Contact your Coordinator if you wish to join the official responder network.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8">
            <RescueMap alerts={alerts} onResolve={handleResolve} canResolve={isResponder} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Live Alert Signal
            </h2>

            {alertsLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : activeAlerts.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 bg-muted/20">
                <UserCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">No active distress signals.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeAlerts.map((alert: any) => (
                  <Card key={alert.id} className="shadow-lg border-l-4 border-l-red-600 overflow-hidden group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-sm uppercase text-primary leading-tight">{alert.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                            {alert.timestamp ? formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                        <Badge className="bg-red-600 font-black text-[8px] uppercase animate-pulse">DISTRESS</Badge>
                      </div>
                      
                      <div className="p-3 bg-red-50 rounded-lg text-xs italic text-red-900 border border-red-100">
                        "{alert.message}"
                      </div>

                      {isResponder && (
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => window.location.href = `tel:${alert.phoneNumber}`}
                            className="flex-1 h-9 bg-primary text-white font-black uppercase text-[9px] rounded-lg shadow-md hover:bg-primary/90 transition-all"
                          >
                            Call Member
                          </button>
                          <button 
                            onClick={() => handleResolve(alert.id)}
                            className="flex-1 h-9 bg-green-600 text-white font-black uppercase text-[9px] rounded-lg shadow-md hover:bg-green-700 transition-all"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="pt-6 border-t">
              <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-2 mb-4 opacity-60">
                Aid Rendered
              </h2>
              <div className="space-y-3 opacity-60">
                {resolvedAlerts.slice(0, 3).map((alert: any) => (
                  <div key={alert.id} className="p-3 bg-white border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary leading-none">{alert.name}</p>
                      <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Resolved by: {alert.resolvedBy}</p>
                    </div>
                    <Badge variant="outline" className="border-green-600 text-green-600 h-5 px-1.5 font-black text-[7px] uppercase">
                      AIDED
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
