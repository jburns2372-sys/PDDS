
"use client";

import { useCollection, useFirestore } from '@/firebase';
import { OfficerCard } from './officer-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pddsLeadershipRoles, jurisdictionLevels } from '@/lib/data';
import { Loader2, Users, CheckCircle2, ChevronRight, MapPin, Search, MessageSquare, Phone, MessageCircle } from 'lucide-react';
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
      // Log to communication_logs
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
          description: "Encrypted channel is being provisioned. Please use SMS for urgent alerts."
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

            {template && (
              <div className="p-4 bg-muted/50 rounded-xl border border-dashed text-sm italic text-muted-foreground leading-relaxed">
                "{templates.find(t => t.id === template)?.text}"
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleAction('SMS')} 
                disabled={!template}
                className="h-12 font-black uppercase tracking-widest text-xs"
              >
                <Phone className="h-4 w-4 mr-2" /> Send SMS
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAction('CHAT')} 
                disabled={!template}
                className="h-12 font-black uppercase tracking-widest text-xs border-primary text-primary"
              >
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

  // Check if current user has officer/admin privileges
  const isPrivileged = useMemo(() => {
    if (!userData) return false;
    const userRole = userData.role || '';
    const userEmail = (userData.email || '').toLowerCase();
    const privilegedEmails = ['iamgrecobelgica@gmail.com', 'j.burns372@gmail.com', 'j.burns2372@gmail.com'];
    return pddsLeadershipRoles.includes(userRole) || userRole === 'Officer' || userRole === 'Admin' || userRole === 'System Admin' || privilegedEmails.includes(userEmail);
  }, [userData]);

  // Set default tab based on user role once data is available
  useEffect(() => {
    if (userData?.role === 'Supporter') {
      setActiveTab('Supporter');
    }
  }, [userData]);

  // Logic to group supporters by Province > City, then by Barangay
  const groupedSupporters = useMemo(() => {
    const supporters = (users || []).filter(u => {
      const isSupporter = u.role === 'Supporter';
      const matchesSearch = supporterSearch === "" || 
        (u.fullName || '').toLowerCase().includes(supporterSearch.toLowerCase()) ||
        (u.city || '').toLowerCase().includes(supporterSearch.toLowerCase()) ||
        (u.province || '').toLowerCase().includes(supporterSearch.toLowerCase());
      return isSupporter && matchesSearch;
    });

    const groups: Record<string, Record<string, any[]>> = {};

    supporters.forEach(u => {
      const p = u.province || 'Unknown Province';
      const c = u.city || 'Unknown City';
      const b = u.barangay || 'Unknown Barangay';
      const key = `${p} > ${c}`;
      
      if (!groups[key]) groups[key] = {};
      if (!groups[key][b]) groups[key][b] = [];
      groups[key][b].push(u);
    });

    return groups;
  }, [users, supporterSearch]);

  // Dynamic count logic based on active tab
  const dynamicCount = useMemo(() => {
    if (!users) return 0;
    if (activeTab === 'Supporter') {
      return users.filter(u => u.role === 'Supporter').length;
    }
    // For jurisdiction tabs, show count of people assigned to that level
    return users.filter(u => u.jurisdictionLevel === activeTab).length;
  }, [users, activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing Structure...</p>
      </div>
    );
  }

  const tabList = [...jurisdictionLevels, "Supporter"];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 overflow-x-auto justify-start h-auto flex-wrap">
            {tabList.map(level => (
              <TabsTrigger 
                key={level} 
                value={level} 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-4 py-2"
              >
                {level}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="text-sm font-black uppercase tracking-widest text-primary bg-white px-4 py-2 rounded-full border shadow-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registry Count: {dynamicCount}
          </div>
        </div>

        {jurisdictionLevels.map(level => (
          <TabsContent key={level} value={level} className="mt-0 focus-visible:outline-none">
              <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-xl font-headline text-primary/80 flex items-center gap-2 uppercase tracking-tight">
                          {level} Leadership Core
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {pddsLeadershipRoles.map((role) => {
                              const officer = (users || []).find(u => 
                                  u.role === role && u.jurisdictionLevel === level
                              );
                              
                              return (
                                  <OfficerCard 
                                      key={`${level}-${role}`} 
                                      role={role} 
                                      name={officer?.fullName || ""} 
                                      photoURL={officer?.photoURL || ""}
                                      about={officer?.aboutText || ""}
                                  />
                              );
                          })}
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>
        ))}

        <TabsContent value="Supporter" className="mt-0 focus-visible:outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl font-headline text-primary/80 flex items-center gap-2 uppercase tracking-tight">
                National Supporter Network
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search supporters..."
                  className="w-full bg-white border border-primary/10 rounded-full h-10 pl-9 pr-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none shadow-sm"
                  value={supporterSearch}
                  onChange={(e) => setSupporterSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {Object.keys(groupedSupporters).length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <p className="text-muted-foreground font-medium">No supporters found matching your criteria.</p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full space-y-4">
                  {Object.keys(groupedSupporters).sort().map(locationKey => (
                    <AccordionItem key={locationKey} value={locationKey} className="border-none">
                      <AccordionTrigger className="bg-primary text-primary-foreground px-6 py-4 rounded-xl hover:no-underline shadow-md text-left flex justify-between group transition-all">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 shrink-0 text-accent" />
                          <span className="text-base font-black uppercase tracking-tight line-clamp-1">{locationKey}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 px-2">
                        <div className="space-y-10">
                          {Object.keys(groupedSupporters[locationKey]).sort().map(barangay => (
                            <div key={barangay} className="space-y-4">
                              <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] flex items-center gap-2 mb-2 border-b pb-2">
                                <ChevronRight className="h-3 w-3 text-accent" />
                                Barangay: {barangay}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedSupporters[locationKey][barangay].map(supporter => (
                                  <Card key={supporter.id} className="shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow group">
                                    <CardContent className="p-4 flex flex-col gap-2">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                          <p className="font-black text-sm uppercase text-primary leading-tight truncate group-hover:text-accent transition-colors">
                                            {supporter.fullName}
                                          </p>
                                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 truncate">
                                            {supporter.jurisdictionLevel || 'Local'} Jurisdiction
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {supporter.phoneNumber && (
                                            <Badge className="bg-green-600 text-[8px] font-black uppercase px-1.5 h-4 shrink-0 shadow-sm">
                                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                              Verified
                                            </Badge>
                                          )}
                                          <QuickMessageDialog supporter={supporter} isPrivileged={isPrivileged} />
                                        </div>
                                      </div>
                                      <div className="pt-2 border-t mt-1 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Supporter Category</span>
                                        <Badge variant="secondary" className="text-[8px] font-bold bg-primary/5 px-2 py-0.5 rounded text-primary uppercase">
                                          Active
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
