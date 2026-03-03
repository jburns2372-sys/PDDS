"use client";

import { useCollection, useFirestore } from '@/firebase';
import { OfficerCard } from './officer-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pddsLeadershipRoles, jurisdictionLevels } from '@/lib/data';
import { Loader2, Users, CheckCircle2, ChevronRight, MapPin, Search, MessageSquare, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useUserData } from '@/context/user-data-context';
import { useMemo, useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function QuickMessageDialog({ supporter, isPrivileged }: { supporter: any, isPrivileged: boolean }) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState("");
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  const templates = [
    { id: "welcome", label: "Welcome Briefing", text: "Welcome to the party! Are you available for a local briefing?" },
    { id: "update", label: "Regional Update", text: `New regional update for ${supporter.province || 'your area'} is now available in the portal.` },
  ];

  const handleOpen = () => {
    if (!supporter.phoneNumber) {
      toast({
        variant: "destructive",
        title: "Action Restricted",
        description: "Communication requires a verified phone number."
      });
      return;
    }
    setOpen(true);
  };

  const handleAction = async (type: 'SMS' | 'CHAT') => {
    if (!template) return;
    const selectedTemplate = templates.find(t => t.id === template);
    const messageText = selectedTemplate?.text || "";

    try {
      addDoc(collection(firestore, 'communication_logs'), {
        officerUid: userData?.uid,
        officerName: userData?.fullName,
        supporterUid: supporter.uid || supporter.id,
        supporterName: supporter.fullName,
        type,
        templateUsed: selectedTemplate?.label,
        messageContent: messageText,
        timestamp: serverTimestamp()
      });

      if (type === 'SMS') {
        window.location.href = `sms:${supporter.phoneNumber}?body=${encodeURIComponent(messageText)}`;
      } else {
        toast({
          title: "In-App Chat initiated",
          description: "Encrypted channel is being provisioned."
        });
      }
      setOpen(false);
    } catch (error) {
      console.error("Audit log failed:", error);
    }
  };

  if (!isPrivileged) return null;

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-primary group-hover:bg-primary group-hover:text-white transition-all rounded-full" 
        onClick={handleOpen}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase text-primary">Quick Message Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {supporter.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black uppercase">{supporter.fullName}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{supporter.phoneNumber}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Select Quick Template</Label>
              <Select onValueChange={setTemplate} value={template}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a pre-written message..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs font-bold">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleAction('SMS')} disabled={!template} className="h-12 font-black uppercase text-xs">
                <Phone className="h-4 w-4 mr-2" /> Send SMS
              </Button>
              <Button variant="outline" onClick={() => handleAction('CHAT')} disabled={!template} className="h-12 font-black uppercase text-xs border-primary text-primary">
                <MessageCircle className="h-4 w-4 mr-2" /> In-App Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DirectoryClient() {
  const { userData } = useUserData();
  const { data: users, loading } = useCollection('users');
  const [activeTab, setActiveTab] = useState('National');
  const [supporterSearch, setSupporterSearch] = useState("");

  const isPrivileged = useMemo(() => {
    if (!userData) return false;
    return pddsLeadershipRoles.includes(userData.role) || ['Admin', 'Officer', 'System Admin'].includes(userData.role);
  }, [userData]);

  const maskPhone = (phone: string) => {
    if (!phone) return "No contact";
    if (isPrivileged && (userData?.role === 'President' || userData?.role === 'Secretary General' || userData?.role === 'Admin')) {
      return phone;
    }
    return phone.slice(0, 4) + "*******" + phone.slice(-2);
  };

  const groupedSupporters = useMemo(() => {
    const supporters = (users || []).filter(u => {
      const isSupporter = u.role === 'Supporter';
      const matchesSearch = supporterSearch === "" || 
        (u.fullName || '').toLowerCase().includes(supporterSearch.toLowerCase()) ||
        (u.city || '').toLowerCase().includes(supporterSearch.toLowerCase());
      return isSupporter && matchesSearch;
    });

    const groups = {} as any;
    supporters.forEach(u => {
      const key = `${u.province || 'Unknown'} > ${u.city || 'Unknown'}`;
      const b = u.barangay || 'Unknown Barangay';
      if (!groups[key]) groups[key] = {};
      if (!groups[key][b]) groups[key][b] = [];
      groups[key][b].push(u);
    });
    return groups;
  }, [users, supporterSearch]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 overflow-x-auto justify-start h-auto">
            {[...jurisdictionLevels, "Supporter"].map(level => (
              <TabsTrigger key={level} value={level} className="data-[state=active]:bg-primary data-[state=active]:text-white font-bold px-6 py-2 uppercase text-[10px] tracking-widest">
                {level}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {jurisdictionLevels.map(level => (
          <TabsContent key={level} value={level}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pddsLeadershipRoles.map(role => {
                const officer = users.find(u => u.role === role && u.jurisdictionLevel === level);
                return <OfficerCard key={role} role={role} name={officer?.fullName || ""} photoURL={officer?.photoURL} about={officer?.about} />;
              })}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="Supporter">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search supporters..." className="w-full bg-white border rounded-full h-12 pl-10 pr-4 text-xs font-bold uppercase" value={supporterSearch} onChange={e => setSupporterSearch(e.target.value)} />
            </div>
            
            <Accordion type="multiple" className="space-y-4">
              {Object.keys(groupedSupporters).map(loc => (
                <AccordionItem key={loc} value={loc} className="border-none">
                  <AccordionTrigger className="bg-primary text-white px-6 py-4 rounded-xl hover:no-underline shadow-md">
                    <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-accent" /><span className="text-sm font-black uppercase">{loc}</span></div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-2">
                    {Object.keys(groupedSupporters[loc]).map(brgy => (
                      <div key={brgy} className="mb-6">
                        <h3 className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-3 border-b pb-1">Barangay: {brgy}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedSupporters[loc][brgy].map((s: any) => (
                            <Card key={s.id} className="shadow-sm border-l-4 border-l-accent group">
                              <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-black text-xs uppercase text-primary">{s.fullName}</p>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{maskPhone(s.phoneNumber)}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    {s.isVerified && <Badge className="bg-green-600 h-4 px-1 text-[7px] font-black uppercase"><ShieldCheck className="h-2 w-2 mr-1" /> VETTED</Badge>}
                                    <QuickMessageDialog supporter={s} isPrivileged={isPrivileged} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
