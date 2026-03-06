"use client";

import { useMemo } from "react";
import { useCollection, useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Landmark, 
  History, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Receipt,
  ExternalLink,
  Printer,
  Home,
  HeartHandshake,
  Megaphone,
  Package,
  CheckCircle2
} from "lucide-react";
import { PondoDonationCard } from "@/components/pondo-donation-card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip 
} from "recharts";
import { format } from "date-fns";

/**
 * @fileOverview PatriotPondo - National Financial Transparency Dashboard.
 * REFACTORED: Fluid 12-column grid spanning the full screen width.
 */
export default function PatriotPondoPage() {
  const { user } = useUser();
  const { data: donations, loading: donLoading } = useCollection('donations', {
    queries: [{ attribute: 'status', operator: '==', value: 'Successful' }]
  });
  const { data: expenses, loading: expLoading } = useCollection('expenses');

  const stats = useMemo(() => {
    const totalPondo = donations.reduce((acc, d) => acc + (d.amount || 0), 0);
    const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const balance = totalPondo - totalSpent;

    const expenseByCategory = expenses.reduce((acc: any, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    const regionalDataMap: Record<string, number> = {};
    donations.forEach(d => {
      const region = d.region || "National";
      regionalDataMap[region] = (regionalDataMap[region] || 0) + d.amount;
    });

    const barData = Object.entries(regionalDataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { totalPondo, totalSpent, balance, pieData, barData };
  }, [donations, expenses]);

  if (donLoading || expLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing National Ledger...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#002366', '#D4AF37', '#dc2626', '#10b981', '#6366f1'];

  return (
    <div className="p-4 md:p-8 lg:p-10 bg-background min-h-screen pb-32">
      <div className="w-full space-y-10">
        
        {/* Financial Header - Full Width */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-primary pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-white rounded-xl shadow-xl">
              <Landmark className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tight">PatriotPondo</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase border-none">Verified Transparency</Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20">Audit Trail Active</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-2xl md:text-3xl font-black text-primary">₱{stats.totalPondo.toLocaleString()}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Collections</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl md:text-3xl font-black ${stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₱{stats.balance.toLocaleString()}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Vault Balance</p>
            </div>
          </div>
        </div>

        {/* 12-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed & Analytics (8/12) */}
          <div className="lg:col-span-8 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-t-4 border-primary bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <PieChartIcon className="h-4 w-4 text-accent" />
                    Allocation breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.pieData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-t-4 border-accent bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Regional Strength
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.barData}>
                      <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} />
                      <YAxis hide />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="#002366" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full justify-start overflow-x-auto">
                <TabsTrigger value="expenses" className="px-8 h-full font-black uppercase text-[10px] tracking-widest">
                  <Receipt className="h-4 w-4 mr-2" /> Expenditure Feed
                </TabsTrigger>
                <TabsTrigger value="ledger" className="px-8 h-full font-black uppercase text-[10px] tracking-widest">
                  <History className="h-4 w-4 mr-2" /> Collection Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expenses" className="pt-6">
                <div className="space-y-4">
                  {expenses.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                      <p className="text-xs font-bold text-muted-foreground uppercase">No expenditures logged yet.</p>
                    </div>
                  ) : (
                    expenses.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((e: any) => (
                      <Card key={e.id} className="shadow-lg border-l-4 border-l-red-600 overflow-hidden group hover:shadow-xl transition-all bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shadow-inner">
                                <Receipt className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <p className="font-black text-sm uppercase text-primary leading-tight">{e.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">{e.category}</Badge>
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase">{e.timestamp ? format(e.timestamp.toDate(), 'MMM dd, yyyy') : 'Recently'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-red-600 text-lg">-₱{e.amount.toLocaleString()}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">VERIFIED</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-dashed flex items-center justify-between">
                            <div className="text-[8px] font-black uppercase text-primary/40 tracking-widest">
                              AUDIT ID: {e.id.substring(0, 12).toUpperCase()}
                            </div>
                            {e.receiptUrl && (
                              <Button variant="outline" size="sm" asChild className="h-9 font-black uppercase text-[9px] tracking-widest border-2 hover:bg-primary hover:text-white transition-all">
                                <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-2" /> View Receipt
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ledger" className="pt-6">
                <div className="space-y-4">
                  {donations.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 20).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                          <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase text-primary leading-none">
                            {d.isAnonymous ? "Anonymous Patriot" : d.donorName}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                            {d.region} • {d.timestamp ? format(d.timestamp.toDate(), 'MMM dd, p') : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600 text-lg">₱{d.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="text-[7px] font-black uppercase border-emerald-200 text-emerald-700 h-4 px-1">SUCCESSFUL</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Donation Sidebar (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            <PondoDonationCard />
            
            <Card className="bg-primary text-white shadow-2xl overflow-hidden relative border-none">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="pondo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#pondo-grid)" />
                </svg>
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent animate-pulse" />
                  <h3 className="font-black uppercase text-sm tracking-tight">Financial Sovereignty</h3>
                </div>
                <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                  "Every centavo fuels our national mobilization. By maintaining a public ledger, we ensure that the resources of the movement are utilized with absolute integrity and transparency."
                </p>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent">Office of the Treasurer</p>
                  <CheckCircle2 className="h-3 w-3 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}