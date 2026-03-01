
"use client";

import { useState } from "react";
import { useUserData } from "@/context/user-data-context";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, CalendarDays, MapPin, Loader2, Sparkles, ShieldCheck } from "lucide-react";

export function HostMeetingDialog() {
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Kapihan");
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const isEligible = userData?.vettingLevel === 'Silver' || userData?.vettingLevel === 'Gold';

  if (!isEligible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !address) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide a title, date, and location." });
      return;
    }

    setLoading(true);
    const requestData = {
      hostUid: userData.uid,
      hostName: userData.fullName,
      title: title.trim().toUpperCase(),
      meetingType: type,
      dateTime: date,
      locationAddress: address.trim(),
      city: userData.city,
      province: userData.province,
      description: description.trim(),
      status: "Pending",
      createdAt: serverTimestamp(),
      // Mock coordinates for the map (centered near Manila for simulation)
      locationCoords: {
        lat: 14.5995 + (Math.random() - 0.5) * 0.1,
        lng: 120.9842 + (Math.random() - 0.5) * 0.1
      }
    };

    try {
      await addDoc(collection(firestore, "meeting_requests"), requestData);
      toast({ title: "Proposal Submitted", description: "Your local mobilization request has been sent to your Coordinator for audit." });
      setOpen(false);
      // Reset form
      setTitle(""); setType("Kapihan"); setDate(""); setAddress(""); setDescription("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 px-8 font-black uppercase tracking-widest shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
          <Users className="mr-2 h-5 w-5" />
          Host Local Gathering
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl flex items-center gap-3 text-primary uppercase">
              <Sparkles className="h-6 w-6 text-accent" />
              Community Mobilizer
            </DialogTitle>
            <DialogDescription className="font-bold text-xs uppercase tracking-tight">
              Propose a local PDDS gathering. Your Regional Coordinator will audit the request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-5">
            <div className="bg-primary/5 p-4 rounded-lg border border-dashed border-primary/20 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-[10px] font-black uppercase text-primary leading-tight">
                Authorized for {userData.vettingLevel} Tier Mobilizers only.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary">Gathering Title</Label>
              <Input placeholder="e.g. BARANGAY KAPIHAN & DIALOGUE" value={title} onChange={e => setTitle(e.target.value.toUpperCase())} className="h-12 border-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Gathering Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kapihan" className="font-bold">KAPIHAN</SelectItem>
                    <SelectItem value="Study Group" className="font-bold">STUDY GROUP</SelectItem>
                    <SelectItem value="Rally" className="font-bold">LOCAL RALLY</SelectItem>
                    <SelectItem value="Community Service" className="font-bold">COMMUNITY SERVICE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary">Date & Time</Label>
                <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="h-12 border-2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary">Venue Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                <Input placeholder="Complete address of gathering..." value={address} onChange={e => setAddress(e.target.value)} className="h-12 pl-10 border-2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary">Detailed Objectives</Label>
              <Textarea placeholder="What is the goal of this mobilization?" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[100px] border-2" />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-2xl" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Distributing Directive...</> : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
