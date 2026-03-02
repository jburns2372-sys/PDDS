
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
  ExternalLink
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
 * Displays real-time collections and expenditures to members.
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['#002366', '#D4AF37', '#dc2626', '#10b981', '#6366f1'];

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Financial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-primary pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-white rounded-xl shadow-xl">
              <Landmark className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tight">PatriotPondo</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase border-none">Verified Transparency</Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20">Real-Time Ledger</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-2xl font-black text-primary">₱{stats.totalPondo.toLocaleString()}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">National collections</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">₱{stats.balance.toLocaleString()}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Current Vault</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed & Analytics */}
          <div className="lg:col-span-8 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-t-4 border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-accent" />
                    Spending Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-t-4 border-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Top Regional Collections
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.barData}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="#002366" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="ledger" className="w-full">
              <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full justify-start overflow-x-auto">
                <TabsTrigger value="ledger" className="px-8 font-black uppercase text-[10px] tracking-widest">
                  <History className="h-4 w-4 mr-2" /> Public Ledger
                </TabsTrigger>
                <TabsTrigger value="expenses" className="px-8 font-black uppercase text-[10px] tracking-widest">
                  <Receipt className="h-4 w-4 mr-2" /> Expense Feed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ledger" className="pt-6">
                <div className="space-y-4">
                  {donations.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 20).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                          <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase text-primary leading-none">
                            {d.isAnonymous ? "Anonymous Patriot" : d.donorName}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                            {d.region} • {format(d.timestamp?.toDate() || new Date(), 'MMM dd, p')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600">₱{d.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="text-[7px] font-black uppercase border-emerald-200 text-emerald-700 h-4 px-1">SUCCESSFUL</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="expenses" className="pt-6">
                <div className="space-y-4">
                  {expenses.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((e: any) => (
                    <div key={e.id} className="flex flex-col p-4 bg-white border rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase text-primary leading-none">{e.title}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                              {e.category} • {format(e.timestamp?.toDate() || new Date(), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-red-600">-₱{e.amount.toLocaleString()}</p>
                          <Badge className="bg-red-700 text-white text-[7px] font-black uppercase h-4 px-1">AUDITED</Badge>
                        </div>
                      </div>
                      {e.receiptUrl && (
                        <div className="pt-3 border-t border-dashed flex justify-end">
                          <Button variant="link" size="sm" asChild className="h-auto p-0 text-[10px] font-black uppercase text-primary">
                            <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" /> View Official Receipt
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Donation Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <PondoDonationCard />
            
            <Card className="bg-primary text-white shadow-2xl overflow-hidden relative">
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
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <h3 className="font-black uppercase text-sm tracking-tight">Financial Sovereignty</h3>
                </div>
                <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                  "A movement funded by its members is a movement beholden only to the people. Every centavo fuels our national mobilization for Federalism."
                </p>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent">Audited by National Treasurer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
