
"use client";

import { useState, useMemo } from "react";
import { useUserData } from "@/context/user-data-context";
import { useCollection, useFirestore } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarDays, 
  MapPin, 
  Video, 
  Plus, 
  Search, 
  Clock, 
  Globe, 
  ChevronRight, 
  Loader2, 
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  Filter,
  CalendarPlus,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO, addHours } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Calendar of Activities page.
 * Global Visibility: Accessible to all members.
 * RBAC: Only President, Admin, Sec Gen can manage.
 * Features: Smart regional filtering and external calendar sync.
 */

const NCR_CODE = "130000000";

export default function CalendarActivitiesPage() {
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Data Stream - Fetches all activities for global visibility
  const { data: activities, loading } = useCollection('calendar_activities');

  // UI State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  // Default filter is 'smart' - shows National + My Region
  const [filter, setFilter] = useState<'smart' | 'all' | 'national' | 'region'>('smart');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [scope, setScope] = useState<"National" | "Regional">("National");
  const [targetProvince, setTargetProvince] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  // Location Data State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // RBAC Permission Check - Strictly restricted creation/edit
  const canManage = useMemo(() => {
    const roles = ['President', 'Admin', 'Secretary General'];
    return userData && roles.includes(userData.role);
  }, [userData]);

  // Fetch Locations for the creation form
  useMemo(() => {
    const fetchLocations = async () => {
      try {
        const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
        const pData = await pResp.json();
        const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
        const ncrData = await ncrResp.json();
        setProvinces([{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name)));
      } catch (e) {}
    };
    if (canManage) fetchLocations();
  }, [canManage]);

  // Fetch Cities when province is selected in form
  useMemo(() => {
    const fetchCities = async () => {
      if (!targetProvince) return;
      const province = provinces.find(p => p.name === targetProvince);
      if (province) {
        const endpoint = province.isNCR 
            ? `https://psgc.gitlab.io/api/regions/${NCR_CODE}/cities-municipalities/`
            : `https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities/`;
        const resp = await fetch(endpoint);
        const data = await resp.json();
        setCities(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      }
    };
    fetchCities();
  }, [targetProvince, provinces]);

  // Global Filtering Logic
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (filter === 'national') return a.scope === 'National';
      if (filter === 'region') return a.scope === 'Regional' && (a.targetProvince === userData?.province || a.targetCity === userData?.city);
      if (filter === 'smart') {
        // Smart view: show all national + only my regional events
        return a.scope === 'National' || (a.scope === 'Regional' && (a.targetProvince === userData?.province || a.targetCity === userData?.city));
      }
      return true; // 'all' view shows everything nationwide
    }).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  }, [activities, filter, userData]);

  const selectedDayActivities = useMemo(() => {
    if (!selectedDate) return [];
    return filteredActivities.filter(a => isSameDay(parseISO(a.startDate), selectedDate));
  }, [filteredActivities, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) {
      toast({ variant: "destructive", title: "Required Fields Missing" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'calendar_activities'), {
        title,
        description,
        startDate,
        scope,
        targetProvince: scope === 'Regional' ? targetProvince : null,
        targetCity: scope === 'Regional' ? targetCity : null,
        meetingLink,
        locationAddress,
        organizerName: userData?.fullName || 'Official',
        organizerUid: userData?.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "Activity Scheduled", description: `${title} is now live on the National Calendar.` });
      setIsModalOpen(false);
      // Reset form
      setTitle(""); setDescription(""); setStartDate(""); setMeetingLink(""); setLocationAddress("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Scheduling Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this activity?")) return;
    try {
      await deleteDoc(doc(firestore, 'calendar_activities', id));
      toast({ title: "Activity Removed" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    }
  };

  const getGoogleCalendarUrl = (activity: any) => {
    const start = parseISO(activity.startDate);
    const end = addHours(start, 1); // Assume 1 hour default
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const dates = `${fmt(start)}/${fmt(end)}`;
    const details = encodeURIComponent(activity.description || "Official PDDS Activity");
    const title = encodeURIComponent(`[PDDS] ${activity.title}`);
    const location = encodeURIComponent(activity.locationAddress || activity.meetingLink || "PH");
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-card p-6 md:p-8 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
              National Mobilization Calendar
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Synchronize your schedule with official party activities across the archipelago.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-primary/40 ml-1">Context Filter</span>
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-[200px] bg-background border-primary/20 h-12 font-bold shadow-sm">
                  <Filter className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="View Content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">My Local Context</SelectItem>
                  <SelectItem value="all">View All Regions</SelectItem>
                  <SelectItem value="national">National Directives</SelectItem>
                  <SelectItem value="region">My Specific Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canManage && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 px-6 font-black uppercase tracking-widest shadow-xl rounded-xl mt-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Schedule Activity
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle className="font-headline text-xl flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        New Party Activity
                      </DialogTitle>
                      <DialogDescription>Coordinate operations across the national hierarchy.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Activity Title</Label>
                        <Input placeholder="e.g. Regional Strategic Assembly" value={title} onChange={e => setTitle(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date & Start Time</Label>
                        <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Scope</Label>
                        <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="National">National</SelectItem>
                            <SelectItem value="Regional">Regional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {scope === 'Regional' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-2">
                            <Label>Province</Label>
                            <Select onValueChange={setTargetProvince} value={targetProvince}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {provinces.map(p => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Select onValueChange={setTargetCity} value={targetCity} disabled={!targetProvince}>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {cities.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Virtual Link (Optional)</Label>
                        <div className="relative">
                          <Video className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="https://..." value={meetingLink} onChange={e => setMeetingLink(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Physical Location (Optional)</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Address..." value={locationAddress} onChange={e => setLocationAddress(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Detailed Agenda</Label>
                        <Textarea placeholder="Objectives and operational notes..." value={description} onChange={e => setDescription(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full font-black h-12 uppercase tracking-widest" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Dispatch Activity"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendar Picker & Legend */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-xl border-none overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Date Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-none"
                modifiers={{
                  hasEvent: (date) => filteredActivities.some(a => isSameDay(parseISO(a.startDate), date)),
                  isNational: (date) => filteredActivities.some(a => isSameDay(parseISO(a.startDate), date) && a.scope === 'National'),
                  isRegional: (date) => filteredActivities.some(a => isSameDay(parseISO(a.startDate), date) && a.scope === 'Regional')
                }}
                modifiersStyles={{
                  hasEvent: { fontWeight: 'bold' },
                  isNational: { color: 'hsl(var(--accent))', textDecoration: 'underline' },
                  isRegional: { color: 'hsl(var(--primary))', textDecoration: 'underline' }
                }}
              />
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 border-t grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <div className="h-2 w-2 rounded-full bg-accent" /> National Directive
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <div className="h-2 w-2 rounded-full bg-primary" /> Regional Activity
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-primary shadow-2xl border-none text-white overflow-hidden group">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Mobilization Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium leading-relaxed italic">
                "Synchronizing your local presence with the national movement ensures operational continuity."
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <Globe className="h-4 w-4 text-accent animate-pulse" />
                <span className="text-xs font-bold uppercase">{userData?.city}, {userData?.province}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
              Activities for {selectedDate ? format(selectedDate, 'PPPP') : 'Selected Day'}
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-black">
              {selectedDayActivities.length} Operations
            </Badge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing Party Records...</p>
            </div>
          ) : selectedDayActivities.length === 0 ? (
            <Card className="p-24 text-center border-dashed border-2 bg-muted/20">
              <div className="flex flex-col items-center gap-4">
                <Search className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">No party activities scheduled for this date in your view.</p>
                <Button variant="ghost" onClick={() => setFilter('all')} className="text-[10px] font-black uppercase tracking-widest">
                  View other regions <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {selectedDayActivities.map((activity: any) => (
                <Card key={activity.id} className={cn(
                  "shadow-lg border-l-4 overflow-hidden group hover:shadow-xl transition-all",
                  activity.scope === 'National' ? 'border-l-accent' : 'border-l-primary'
                )}>
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-headline uppercase font-black text-primary leading-tight">
                            {activity.title}
                          </CardTitle>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            activity.scope === 'National' ? 'bg-accent text-accent-foreground' : 'bg-primary text-white'
                          )}>
                            {activity.scope}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parseISO(activity.startDate), 'p')}</span>
                          {activity.scope === 'Regional' && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {activity.targetCity}, {activity.targetProvince}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          asChild 
                          className="h-8 w-8 rounded-full border-primary/20 text-primary hover:bg-primary hover:text-white"
                          title="Sync to Google Calendar"
                        >
                          <a href={getGoogleCalendarUrl(activity)} target="_blank" rel="noopener noreferrer">
                            <CalendarPlus className="h-4 w-4" />
                          </a>
                        </Button>

                        {canManage && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-40 p-1">
                              <Button variant="ghost" className="w-full justify-start text-xs font-bold text-destructive" onClick={() => handleDelete(activity.id)}>
                                Cancel Activity
                              </Button>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium italic mb-6">
                      "{activity.description || "Official party directive. Ensure all attendees are verified and in possession of their Digital ID Card."}"
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activity.meetingLink && (
                        <Button asChild className="h-12 font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-lg">
                          <a href={activity.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4" /> Join Virtual Meeting
                          </a>
                        </Button>
                      )}
                      {activity.locationAddress && (
                        <Button variant="outline" className="h-12 font-black uppercase tracking-widest border-primary/20 text-primary">
                          <MapPin className="mr-2 h-4 w-4" /> {activity.locationAddress}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-primary/5 border-t py-3 flex justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">
                      Organizer: {activity.organizerName}
                    </span>
                    <Badge variant="outline" className="text-[8px] opacity-40 uppercase border-none">
                      REF: {activity.id.substring(0, 8)}
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
