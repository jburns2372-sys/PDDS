
"use client";

import { useState } from "react";
import { useUserData } from "@/context/user-data-context";
import { useCollection } from "@/firebase";
import { BantayBayanMap } from "@/components/bantay-bayan-map";
import { BantayBayanForm } from "@/components/bantay-bayan-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, MapPin, Eye, Info, Loader2, ShieldCheck, TrendingUp } from "lucide-react";

/**
 * @fileOverview Bantay Bayan Digital - Civic Accountability Hub.
 * Optimized for community issue documentation and collective verification.
 */
export default function BantayBayanPage() {
  const { userData, loading: userLoading } = useUserData();
  const { data: reports, loading: reportsLoading } = useCollection('civic_reports');
  const [activeTab, setActiveTab] = useState("map");

  if (userLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const isVerified = userData?.isVerified === true;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <div className="bg-card p-6 md:p-8 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-700 text-white rounded-xl shadow-xl">
              <Eye className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
                Bantay Bayan Digital
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-red-100 text-red-700 font-black text-[10px] uppercase border-none">Civic Oversight</Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase">Accountability Engine</Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{reports.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Reports</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-red-600">{reports.filter(r => r.status === 'Escalated').length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Escalated</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {!isVerified && (
          <Card className="bg-amber-50 border-2 border-dashed border-amber-200">
            <CardContent className="p-6 flex items-start gap-4">
              <Info className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-800 uppercase text-sm">Reporting Privileges Restricted</h3>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Only **Verified Members** can submit new civic reports to prevent the spread of unverified information. You can still view the map and verify existing reports via upvoting.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14">
            <TabsTrigger value="map" className="px-10 h-full font-black uppercase text-[10px] tracking-widest">
              <MapPin className="h-4 w-4 mr-2" />
              Community Heat Map
            </TabsTrigger>
            <TabsTrigger value="submit" disabled={!isVerified} className="px-10 h-full font-black uppercase text-[10px] tracking-widest">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8">
                <BantayBayanMap reports={reports} />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <Card className="shadow-lg border-t-4 border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline font-black text-primary uppercase flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      Trending Concerns
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Reports with high community verification.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {reports
                        .sort((a: any, b: any) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
                        .slice(0, 5)
                        .map((report: any) => (
                          <div key={report.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-black text-xs uppercase text-primary line-clamp-1">{report.title}</h4>
                              <Badge className="bg-primary/5 text-primary text-[8px] h-4 font-black">{report.upvotes?.length || 0} VOTES</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <MapPin className="h-2 w-2" /> {report.city}
                            </p>
                          </div>
                        ))}
                      {reports.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground italic text-xs">No reports documented yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-700 text-white shadow-2xl">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-accent" />
                      <h3 className="font-black uppercase text-sm tracking-tight">Oversight Protocol</h3>
                    </div>
                    <p className="text-xs font-medium leading-relaxed italic opacity-80">
                      "Documentation is the first step toward accountability. Use Bantay Bayan to create a permanent, GPS-tagged ledger of community issues for the party to act upon."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="submit" className="animate-in fade-in duration-500">
            <BantayBayanForm onSuccess={() => setActiveTab('map')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
