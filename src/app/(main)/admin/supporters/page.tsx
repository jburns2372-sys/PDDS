
"use client";

import { useCollection, useFirestore, useStorage } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Users, 
  Search, 
  User, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert,
  ShieldCheck,
  Clock,
  Activity,
  MapPin,
  Globe,
  Filter,
  FileEdit,
  Mail,
  ChevronRight,
  Shield,
  Upload,
  UserCheck
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUserData } from "@/context/user-data-context";

const PROMOTABLE_ROLES = ["Supporter", "Volunteer", "Coordinator", "Moderator", "Member", "Officer"];

/**
 * @fileOverview Recruitment & Regional Command Dashboard.
 * Strictly filtered to show only "Supporter" roles for recruitment management.
 * Integrated with Direct Contact (Email), Vetting Flow, and Tactical Notes systems.
 */
export default function AdminSupporterDashboard() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { userData: currentAdmin } = useUserData();
  const { toast } = useToast();
  
  const { data: allUsers, loading } = useCollection('users');

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  
  // Vetting State
  const [selectedUserForVetting, setSelectedUserForVetting] = useState<any>(null);
  const [vettingLevel, setVettingLevel] = useState("Bronze");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [isVetting, setIsVetting] = useState(false);

  // Internal Tactical Notes State
  const [selectedUserForNotes, setSelectedUserForNotes] = useState<any>(null);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // STRICT FILTER: Only show users with the 'Supporter' role
  const supporters = useMemo(() => {
    return allUsers.filter(u => u.role === 'Supporter');
  }, [allUsers]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set(supporters.map(u => u.islandGroup).filter(Boolean));
    return Array.from(districts).sort();
  }, [supporters]);

  const uniqueCities = useMemo(() => {
    const cities = new Set(supporters.map(u => u.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [supporters]);

  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => {
      const matchesSearch = 
        (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDistrict = filterDistrict === "All" || s.islandGroup === filterDistrict;
      const matchesCity = filterCity === "All" || s.city === filterCity;

      return matchesSearch && matchesDistrict && matchesCity;
    }).sort((a: any, b: any) => {
      const dateA = a.lastActive?.seconds || a.joinedAt?.seconds || a.createdAt?.seconds || 0;
      const dateB = b.lastActive?.seconds || b.joinedAt?.seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [supporters, searchTerm, filterDistrict, filterCity]);

  // Live Metrics Command Center
  const stats = useMemo(() => {
    const total = filteredSupporters.length;
    const verified = filteredSupporters.filter(s => s.isVerified === true).length;
    const pending = total - verified;
    return { total, verified, pending };
  }, [filteredSupporters]);

  const handleRoleChange = (userId: string, newRole: string) => {
    const userRef = doc(firestore, "users", userId);
    updateDoc(userRef, { role: newRole })
      .then(() => {
        toast({ 
          title: "Rank Updated", 
          description: `Supporter promoted to ${newRole}. They will now move to the general registry.` 
        });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path, operation: 'update', requestResourceData: { role: newRole }
        }));
      });
  };

  const handleVetting = async () => {
    if (!selectedUserForVetting) return;
    setIsVetting(true);
    let idUrl = selectedUserForVetting.idVerificationUrl || "";

    try {
      // 1. Upload ID Photo to a secure, private folder
      if (idPhoto) {
        const storageRef = ref(storage, `id_verifications/${selectedUserForVetting.id}`);
        await uploadBytes(storageRef, idPhoto);
        idUrl = await getDownloadURL(storageRef);
      }

      // 2. Update the User's document with the official Vetting Status
      const userRef = doc(firestore, "users", selectedUserForVetting.id);
      await updateDoc(userRef, {
        isVerified: true,
        vettingLevel: vettingLevel,
        idVerificationUrl: idUrl,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentAdmin?.fullName || currentAdmin?.role || "Secretary General"
      });

      toast({ 
        title: "Vetting Complete", 
        description: `${selectedUserForVetting.fullName} has been successfully vetted at ${vettingLevel} level.` 
      });
      setSelectedUserForVetting(null);
      setIdPhoto(null);
    } catch (error: any) {
      console.error("Vetting error:", error);
      toast({ variant: "destructive", title: "Vetting Failed", description: error.message });
    } finally {
      setIsVetting(false);
    }
  };

  const handleSendEmail = (email: string, name: string) => {
    const subject = encodeURIComponent("Update from PDDS - PatriotLink Movement");
    const body = encodeURIComponent(`Hello ${name},\n\nThank you for joining the Federalismo Portal. We are glad to have you in the movement.\n\nRespectfully,\nPDDS National Leadership`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleUpdateNotes = async () => {
    if (!selectedUserForNotes) return;
    setIsSavingNote(true);
    const userRef = doc(firestore, "users", selectedUserForNotes.id);
    
    updateDoc(userRef, { adminNotes: noteContent })
      .then(() => {
        toast({ title: "Notes Saved", description: "Internal tactical metadata updated." });
        setSelectedUserForNotes(null);
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path, operation: 'update', requestResourceData: { adminNotes: noteContent }
        }));
      })
      .finally(() => setIsSavingNote(false));
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}? This action is irreversible.`)) {
      const docRef = doc(firestore, "users", userId);
      deleteDoc(docRef)
        .then(() => toast({ title: "Record Removed", description: "Supporter removed from registry." }))
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
        });
    }
  };

  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Role", "District", "City", "Last Active", "Verified", "Vetting Level"];
    const rows = filteredSupporters.map(user => {
      const lastActive = user.lastActive?.toDate ? format(user.lastActive.toDate(), 'yyyy-MM-dd HH:mm') : 'Never';
      return [
        `"${user.fullName || 'Anonymous'}"`,
        `"${user.email || ''}"`,
        `"${user.role || ''}"`,
        `"${user.islandGroup || ''}"`,
        `"${user.city || ''}"`,
        `"${lastActive}"`,
        `"${user.isVerified ? 'Yes' : 'No'}"`,
        `"${user.vettingLevel || 'None'}"`
      ].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `PDDS_Supporters_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Filtering Supporter Base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Export */}
        <div className="flex flex-col gap-6 border-b-2 border-primary pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
                <Globe className="h-6 w-6 md:h-8 md:w-8" />
                Supporter Command Center
              </h1>
              <p className="text-muted-foreground text-sm mt-1 font-medium italic">Managing recruitment, social inductions, and regional pulse.</p>
            </div>
            <Button onClick={exportToCSV} className="h-12 font-black uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 shadow-lg px-6">
              <Download className="mr-2 h-4 w-4" /> Export Recruitment Log
            </Button>
          </div>

          {/* Tactical Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 uppercase font-bold text-xs bg-white" 
                placeholder="Search Identity..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={filterDistrict} onValueChange={setFilterDistrict}>
              <SelectTrigger className="h-12 bg-white font-bold text-xs uppercase">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-primary" />
                  <SelectValue placeholder="Island Group" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Districts</SelectItem>
                {uniqueDistricts.map(d => <SelectItem key={d} value={d} className="uppercase font-bold text-[10px]">{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="h-12 bg-white font-bold text-xs uppercase">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-primary" />
                  <SelectValue placeholder="All Cities" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Cities</SelectItem>
                {uniqueCities.map(c => <SelectItem key={c} value={c} className="uppercase font-bold text-[10px]">{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-center bg-primary/5 rounded-lg border border-primary/5 px-4 h-12">
              <span className="text-[10px] font-black uppercase text-primary/60 mr-2">Inducted:</span>
              <span className="text-lg font-black text-primary">{filteredSupporters.length}</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-l-4 border-l-primary bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Supporter Base</p>
                <p className="text-3xl font-black text-primary">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="h-6 w-6 text-primary/20" />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-emerald-600 bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Verified Base</p>
                <p className="text-3xl font-black text-emerald-600">{stats.verified.toLocaleString()}</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-600/20" />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-orange-600 bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 mb-1">Pending Audit</p>
                <p className="text-3xl font-black text-orange-600">{stats.pending.toLocaleString()}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-600/20" />
            </CardContent>
          </Card>
        </div>

        {/* Command Registry Table */}
        <Card className="shadow-2xl overflow-hidden border-none bg-white">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Recruitment Induction Log
            </CardTitle>
            <Badge variant="outline" className="border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3">
              Role: Supporters Only
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Profile</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">City / District</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Vetting Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Engagement</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Promotion</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSupporters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground italic">
                      No active supporters found in the induction queue.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSupporters.map((user: any) => {
                    const lastActiveRelative = user.lastActive?.toDate 
                      ? formatDistanceToNow(user.lastActive.toDate(), { addSuffix: true }) 
                      : 'Never';
                    
                    return (
                      <TableRow key={user.uid || user.id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/5 shadow-sm">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback className="bg-primary/5 text-primary font-black">
                                {user.fullName?.charAt(0) || <User className="h-5 w-5" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-black text-sm uppercase text-primary leading-tight">{user.fullName}</div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-[11px] font-black text-primary uppercase">{user.city || 'Not Set'}</div>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <ChevronRight className="h-2 w-2 text-accent" />
                              {user.islandGroup || 'District'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {user.isVerified ? (
                              <Badge className={`text-[8px] font-black uppercase w-fit ${
                                user.vettingLevel === 'Gold' ? 'bg-amber-500' : 
                                user.vettingLevel === 'Silver' ? 'bg-slate-400' : 'bg-emerald-600'
                              }`}>
                                <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                                {user.vettingLevel || 'Verified'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[8px] font-black uppercase w-fit opacity-50">
                                <ShieldAlert className="h-2.5 w-2.5 mr-1 text-orange-500" />
                                PENDING AUDIT
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                              <Activity className="h-3 w-3 text-accent" />
                              {lastActiveRelative}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                            <SelectTrigger className="h-9 w-32 text-[10px] font-black uppercase border-primary/20 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROMOTABLE_ROLES.map(role => (
                                <SelectItem key={role} value={role} className="text-[10px] font-bold uppercase">{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full" 
                            title="Direct Outreach"
                            onClick={() => handleSendEmail(user.email, user.fullName)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>

                          {/* 🛡️ Vetting Dialog */}
                          <Dialog open={selectedUserForVetting?.id === user.id} onOpenChange={(open) => {
                            if (open) setSelectedUserForVetting(user);
                            else { setSelectedUserForVetting(null); setIdPhoto(null); }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-full" title="Vetting Flow">
                                <Shield className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
                                  <Shield className="h-5 w-5 text-accent" />
                                  Executive Vetting: {user.fullName}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground">
                                  Secure identity verification and tier assessment.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-primary">Vetting Tier</Label>
                                  <Select onValueChange={setVettingLevel} defaultValue={user.vettingLevel || "Bronze"}>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select Tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Bronze" className="text-xs font-bold uppercase">Bronze (Basic Identity)</SelectItem>
                                      <SelectItem value="Silver" className="text-xs font-bold uppercase">Silver (Background Checked)</SelectItem>
                                      <SelectItem value="Gold" className="text-xs font-bold uppercase">Gold (Executive Approved)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-primary">Upload Government ID</Label>
                                  <div className="relative group">
                                    <Input 
                                      type="file" 
                                      accept="image/*" 
                                      className="h-12 pt-2 text-xs" 
                                      onChange={(e) => setIdPhoto(e.target.files?.[0] || null)}
                                    />
                                    <Upload className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                  <p className="text-[9px] text-muted-foreground italic font-medium">Archived scans are strictly encrypted and visible only to leadership.</p>
                                </div>

                                <div className="bg-primary/5 p-4 rounded-xl border border-dashed border-primary/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase">Audit Log</span>
                                  </div>
                                  <p className="text-[9px] font-medium text-primary/70 leading-relaxed">
                                    "This action will tag the member as VERIFIED and enable their VIP access keys across the PatriotLink network."
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  className="w-full font-black uppercase tracking-widest h-14 shadow-xl" 
                                  onClick={handleVetting}
                                  disabled={isVetting}
                                >
                                  {isVetting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm Vetting Status"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={selectedUserForNotes?.id === user.id} onOpenChange={(open) => {
                            if (open) {
                              setSelectedUserForNotes(user);
                              setNoteContent(user.adminNotes || "");
                            } else {
                              setSelectedUserForNotes(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full" title="Tactical Briefing">
                                <FileEdit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="font-headline uppercase text-primary">Internal Tactical Briefing</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">
                                  Secure metadata for {user.fullName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-primary">Strategic Overview</Label>
                                  <Textarea 
                                    placeholder="Add internal notes on mobilization potential..." 
                                    className="min-h-[150px] text-sm"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                  />
                                </div>
                                <div className="bg-primary/5 p-3 rounded-lg border border-dashed border-primary/20">
                                  <p className="text-[9px] font-bold text-primary/70 leading-relaxed italic">
                                    "Confidential: Notes are visible only to authorized leadership."
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  className="w-full font-black uppercase tracking-widest h-12" 
                                  onClick={handleUpdateNotes}
                                  disabled={isSavingNote}
                                >
                                  {isSavingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Secure Log"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white transition-colors rounded-full" onClick={() => handleDelete(user.id, user.fullName)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
