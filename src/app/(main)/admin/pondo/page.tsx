
"use client";

import { useState, useRef } from "react";
import { useFirestore, useUser, useStorage, useCollection } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Landmark, Loader2, Send, ShieldCheck, Receipt, Wallet, ArrowDownRight } from "lucide-react";

/**
 * @fileOverview Treasurer's Expense Management Terminal.
 * Authorized for Treasurer, President, and Admin roles.
 */
export default function PondoAdminPage() {
  const { userData } = useUserData();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Logistics");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !amount) {
      toast({ variant: "destructive", title: "Audit Error", description: "All fields and receipt photo required." });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Receipt Evidence
      const storageRef = ref(storage, `expenses/${Date.now()}.jpg`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const receiptUrl = await getDownloadURL(uploadResult.ref);

      // 2. Log to Ledger
      await addDoc(collection(firestore, "expenses"), {
        title: title.trim().toUpperCase(),
        amount: Number(amount),
        category,
        receiptUrl,
        loggedBy: userData?.fullName || "Treasurer",
        timestamp: serverTimestamp()
      });

      toast({ title: "Expense Audited", description: "The expenditure has been logged in the public transparency ledger." });
      setTitle(""); setAmount(""); setSelectedFile(null); setPreviewUrl(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logging Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-red-700 text-white rounded-lg shadow-xl">
            <Wallet className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline uppercase tracking-tight">National Vault Command</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">National Treasurer's Terminal for Financial Discipline.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Card className="shadow-2xl border-t-4 border-red-700">
              <form onSubmit={handleLogExpense}>
                <CardHeader className="bg-red-50/50 border-b">
                  <CardTitle className="text-lg font-headline font-black text-red-800 uppercase flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Audit New Expenditure
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                    Record movement of funds with physical evidence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-primary">Expense Title</Label>
                      <Input placeholder="e.g. RALLY SOUND SYSTEM" value={title} onChange={e => setTitle(e.target.value.toUpperCase())} className="h-12 font-bold border-2" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-primary">Amount (PHP)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 font-bold border-2 text-red-600" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Allocation Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-12 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rallies" className="font-bold">RALLIES & ASSEMBLIES</SelectItem>
                        <SelectItem value="Bayanihan Aid" className="font-bold">BAYANIHAN MUTUAL AID</SelectItem>
                        <SelectItem value="Admin" className="font-bold">ADMINISTRATIVE</SelectItem>
                        <SelectItem value="Logistics" className="font-bold">LOGISTICS & UNIFORMS</SelectItem>
                        <SelectItem value="Marketing" className="font-bold">MARKETING & ASSETS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Receipt Capture (Mandatory)</Label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-red-200 rounded-xl p-8 text-center cursor-pointer hover:bg-red-50 transition-all bg-white relative overflow-hidden h-48 flex items-center justify-center"
                    >
                      {previewUrl ? (
                        <img src={previewUrl} className="max-h-40 mx-auto rounded shadow-lg" alt="Receipt Preview" />
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 mx-auto text-red-300" />
                          <p className="text-[10px] font-black uppercase text-red-400">Capture Proof of Purchase</p>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t pt-6">
                  <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-red-700 hover:bg-red-800" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verifying Ledger...</> : <><ArrowDownRight className="mr-2 h-6 w-6" /> Commit to Vault</>}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="shadow-lg border-l-4 border-l-accent bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Auditor's Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <p className="text-xs font-bold text-primary/80 leading-relaxed italic">
                  "Every expenditure must be accompanied by a legible receipt. PatriotPondo is a public trust; unauthorized or undocumented spending will trigger a disciplinary review by the Auditor."
                </p>
                <div className="pt-4 border-t border-accent/20">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-black uppercase opacity-60">Status</span>
                    <Badge className="bg-green-600 font-black text-[8px]">TERMINAL ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-black uppercase opacity-60">Encryption</span>
                    <span className="text-[10px] font-bold text-primary uppercase">AES-256 Enabled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
