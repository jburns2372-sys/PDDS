"use client";

import { useMemo, useState } from "react";
import { useCollection, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Landmark, 
  History, 
  ShieldCheck, 
  Loader2, 
  Receipt,
  HeartHandshake,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ChartTooltip 
} from "recharts";
import { format } from "date-fns";
import { PayDuesButton } from "@/components/pay-dues-button";

export default function PatriotPondoPage() {
  const { user } = useUser();
  const { userData } = useUserData();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: allTransactions, loading: donLoading } = useCollection('donations', {
    queries: [{ attribute: 'status', operator: '==', value: 'Successful' }]
  });
  const { data: expenses, loading: expLoading } = useCollection('expenses');

  const stats = useMemo(() => {
    const totalDues = allTransactions.filter(t => t.type === "Membership Dues").reduce((acc, d) => acc + (d.amount || 0), 0);
    const totalDonations = allTransactions.filter(t => t.type !== "Membership Dues").reduce((acc, d) => acc + (d.amount || 0), 0);
    const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const balance = (totalDues + totalDonations) - totalSpent;

    const expenseByCategory = expenses.reduce((acc: any, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    return { totalDues, totalDonations, totalSpent, balance, pieData, allTransactions };
  }, [allTransactions, expenses]);

  const handleVoluntaryDonation = async (amount: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/paymongo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          userId: user?.uid,
          userName: userData?.fullName,
          description: "Voluntary Patriot Movement Contribution",
          paymentType: "VOLUNTARY_DONATION",
          success_url: `${window.location.origin}/patriot-pondo/success`,
          cancel_url: `${window.location.origin}/patriot-pondo`
        })
      });

      const { checkoutUrl } = await response.json();
      if (checkoutUrl) window.location.href = checkoutUrl;
      else throw new Error("Portal Error");
    } catch (error) {
      toast({ variant: "destructive", title: "Payment Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (donLoading || expLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const COLORS = ['#002366', '#B8860B', '#dc2626', '#10b981'];

  return (
    <div className="p-4 md:p-10 bg-background min-h-screen pb-32">
      <div className="w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-primary pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-white rounded-xl shadow-xl"><Landmark className="h-8 w-8" /></div>
            <div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight italic">PatriotPondo</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase">Verified Transparency</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-right border-r pr-8">
              <p className="text-2xl font-black text-primary">₱{stats.totalDues.toLocaleString()}</p>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 italic">Membership Vault</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">₱{stats.balance.toLocaleString()}</p>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 italic">Total Available</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="shadow-lg border-t-4 border-primary bg-white h-[350px]">
                  <CardHeader><CardTitle className="text-[10px] font-black uppercase">Expenditure Audit</CardTitle></CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {stats.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
               </Card>
               <Card className="shadow-lg border-t-4 border-[#B8860B] bg-white h-[350px]">
                  <CardHeader><CardTitle className="text-[10px] font-black uppercase">Regional Power Index</CardTitle></CardHeader>
                  <CardContent className="h-[250px] flex items-center justify-center italic text-[10px] text-slate-400 font-bold uppercase">Syncing National Heatmap...</CardContent>
               </Card>
            </div>

            <Tabs defaultValue="ledger" className="w-full">
              <TabsList className="bg-slate-100 p-1 h-14 w-full justify-start rounded-2xl">
                <TabsTrigger value="ledger" className="px-8 h-full font-black uppercase text-[10px] tracking-widest"><History className="h-4 w-4 mr-2" /> Collection Log</TabsTrigger>
              </TabsList>
              <TabsContent value="ledger" className="pt-6">
                <div className="space-y-4">
                  {stats.allTransactions.slice(0, 15).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-5 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${d.type === "Membership Dues" ? "bg-blue-50" : "bg-emerald-50"}`}>
                          {d.type === "Membership Dues" ? <ShieldCheck className="h-6 w-6 text-primary" /> : <HeartHandshake className="h-6 w-6 text-emerald-600" />}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase text-primary leading-none mb-1">{d.fullName || "Patriot Member"}</p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase italic">{d.timestamp ? format(d.timestamp.toDate(), 'MMM dd, p') : 'Just now'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-lg ${d.type === "Membership Dues" ? "text-primary" : "text-emerald-600"}`}>₱{d.amount.toLocaleString()}</p>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[7px] font-black uppercase border-none">SETTLED</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-4 border-primary bg-white shadow-2xl rounded-[32px] overflow-hidden">
                <div className="bg-primary p-4 flex justify-between items-center text-white">
                    <span className="text-[10px] font-black uppercase flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Official Dues</span>
                    <Badge className="bg-accent text-primary text-[9px] font-black">2026 CYCLE</Badge>
                </div>
                <CardContent className="p-8 text-center space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Annual Membership Settlement</p>
                        <h3 className="text-4xl font-black text-primary tracking-tighter italic">₱200.00</h3>
                    </div>
                    <PayDuesButton userId={user?.uid || ""} userName={userData?.fullName || "Patriot"} amount={200} variant="tactical" />
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[32px]">
                <CardContent className="p-8 space-y-6">
                    <h3 className="font-black uppercase text-xs text-primary flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-accent" /> Voluntary Contribution</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[50, 100, 500, 1000].map(amt => (
                            <Button key={amt} variant="outline" onClick={() => handleVoluntaryDonation(amt)} className="h-12 border-2 font-black text-primary hover:bg-primary hover:text-white transition-all rounded-xl">₱{amt}</Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
