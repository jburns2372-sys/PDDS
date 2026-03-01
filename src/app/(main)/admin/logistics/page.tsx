"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Truck, Loader2, MapPin, History, LayoutGrid, ClipboardList } from "lucide-react";
import { format } from "date-fns";

/**
 * @fileOverview National Treasurer Logistics & Resource Console.
 * Manages the distribution of party materials to Regional Coordinators.
 */
export default function LogisticsConsolePage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: users, loading: usersLoading } = useCollection('users');
  const { data: logs, loading: logsLoading } = useCollection('logistics_logs');

  const [selectedCoord, setSelectedCoord] = useState("");
  const [itemType, setItemType] = useState("Shirts");
  const [quantity, setQuantity] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const coordinators = useMemo(() => {
    return users.filter(u => u.role === 'Coordinator');
  }, [users]);

  const handleLogShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord || !quantity || Number(quantity) <= 0) {
      toast({ variant: "destructive", title: "Incomplete Entry", description: "Select a recipient and valid quantity." });
      return;
    }

    setIsLogging(true);
    const coord = coordinators.find(c => c.id === selectedCoord);

    try {
      await addDoc(collection(firestore, "logistics_logs"), {
        recipientId: selectedCoord,
        recipientName: coord?.fullName || "Regional Office",
        location: `${coord?.city}, ${coord?.province}`,
        item: itemType,
        quantity: Number(quantity),
        status: "Dispatched",
        dispatchedAt: serverTimestamp(),
        loggedBy: "National Treasurer"
      });

      toast({ title: "Shipment Confirmed", description: `Logged dispatch of ${quantity} ${itemType}.` });
      setQuantity("");
      setSelectedCoord("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logging Failed", description: error.message });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-emerald-600 text-white rounded-lg shadow-xl">
            <LayoutGrid className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline uppercase tracking-tight">Logistics & Resource Tracker</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">National Treasurer's Terminal for Field Command Support.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Dispatch Console */}
          <div className="lg:col-span-5">
            <Card className="shadow-xl border-t-4 border-emerald-600">
              <form onSubmit={handleLogShipment}>
                <CardHeader className="bg-emerald-50/50 border-b">
                  <CardTitle className="text-lg font-headline flex items-center gap-2 text-emerald-800">
                    <Package className="h-5 w-5" />
                    Shipment Dispatch
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                    Record the movement of resources to the field.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Coordinator</Label>
                    <Select value={selectedCoord} onValueChange={setSelectedCoord}>
                      <SelectTrigger className="h-12 border-2">
                        <SelectValue placeholder={usersLoading ? "Syncing..." : "Select Region/Commander"} />
                      </SelectTrigger>
                      <SelectContent>
                        {coordinators.map(c => (
                          <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[10px]">
                            {c.fullName} ({c.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Item Category</Label>
                    <Select value={itemType} onValueChange={setItemType}>
                      <SelectTrigger className="h-12 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shirts" className="font-bold uppercase text-[10px]">Official PDDS Shirts</SelectItem>
                        <SelectItem value="Flags" className="font-bold uppercase text-[10px]">Party Flags / Banners</SelectItem>
                        <SelectItem value="Flyers" className="font-bold uppercase text-[10px]">Educational Flyers</SelectItem>
                        <SelectItem value="IDs" className="font-bold uppercase text-[10px]">Digital ID PVC Cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Quantity Units</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-12 font-bold text-lg border-2"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLogging || usersLoading}
                  >
                    {isLogging ? (
                      <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verifying Ledger...</>
                    ) : (
                      <><Truck className="mr-2 h-6 w-6" /> Confirm Shipment</>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Activity Ledger */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Dispatch Ledger</h2>
            </div>

            <Card className="shadow-2xl overflow-hidden border-none bg-white">
              <TableHeader className="bg-primary">
                <TableRow className="hover:bg-primary border-none">
                  <TableHead className="text-white font-black uppercase text-[10px] pl-6 py-4">Resource</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] py-4">Recipient</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] py-4">Units</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] pr-6 py-4 text-right">Dispatch Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow><TableCell colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-24 text-center text-muted-foreground italic">No shipment records found.</TableCell></TableRow>
                ) : (
                  [...logs].sort((a: any, b: any) => (b.dispatchedAt?.seconds || 0) - (a.dispatchedAt?.seconds || 0)).map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-3 w-3 text-emerald-600" />
                          <span className="font-bold text-xs uppercase">{log.item}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-[11px] font-black text-primary uppercase leading-tight">{log.recipientName}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><MapPin className="h-2 w-2" />{log.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-black text-[10px]">{log.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {log.dispatchedAt ? format(log.dispatchedAt.toDate(), 'MMM dd, yyyy') : 'Pending'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}