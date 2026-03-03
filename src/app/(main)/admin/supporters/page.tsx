"use client";

import { useCollection, useFirestore, useStorage } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShieldCheck, 
  ShieldAlert,
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
  UserCheck,
  Crown
} from "lucide-react";
import { useState, useMemo } from "react";
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
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUserData } from "@/context/user-data-context";

const PROMOTABLE_ROLES = ["Supporter", "Volunteer", "Coordinator", "Moderator", "Member", "Officer", "Admin", "President"];

/**
 * @fileOverview Recruitment & Regional Command Dashboard.
 * Optimized for President Visibility: Shows ALL users if President is logged in.
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
  
  // Single-Instance Dialog States
  const [vettingUser, setVettingUser] = useState<any>(null);
  const [notesUser, setNotesUser] = useState<any>(null);
  
  // Form States for Active Dialogs
  const [vettingLevel, setVettingLevel] = useState("Bronze");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [isVetting, setIsVetting] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const isPresident = currentAdmin?.role === 'President' || currentAdmin?.isSuperAdmin;

  // Visibility Logic: President sees everyone, others see only Supporters
  const baseUsers = useMemo(() => {
    if (isPresident) return allUsers;
    return allUsers.filter(u => u.role === 'Supporter');
  }, [allUsers, isPresident]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set(baseUsers.map(u => u.islandGroup).filter(Boolean));
    return Array.from(districts).sort();
  }, [baseUsers]);

  const uniqueCities = useMemo(() => {
    const cities = new Set(baseUsers.map(u => u.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [baseUsers]);

  const filteredUsers = useMemo(() => {
    return baseUsers.filter(s => {
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
  }, [baseUsers, searchTerm, filterDistrict, filterCity]);

  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const verified = filteredUsers.filter(s => s.isVerified === true).length;
    const pending = total - verified;
    return { total, verified, pending };
  }, [filteredUsers]);

  const handleRoleChange = (userId: string, newRole: string) => {
    const userRef = doc(firestore, "users", userId);
    updateDoc(userRef, { role: newRole })
      .then(() => {
        toast({ title: "Rank Updated", description: `User promoted to ${newRole}.` });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path, operation: 'update', requestResourceData: { role: newRole }
        }));
      });
  };

  const handleVetting = async () => {
    if (!vettingUser) return;
    setIsVetting(true);
    let idUrl = vettingUser.idVerificationUrl || "";

    try {
      if (idPhoto) {
        const storageRef = ref(storage, `id_verifications/${vettingUser.id}`);
        await uploadBytes(storageRef, idPhoto);
        idUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(firestore, "users", vettingUser.id);
      await updateDoc(userRef, {
        isVerified: true,
        vettingLevel: vettingLevel,
        idVerificationUrl: idUrl,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentAdmin?.fullName || "Leadership"
      });

      toast({ title: "Vetting Complete", description: `${vettingUser.fullName} has been vetted.` });
      setVettingUser(null);
      setIdPhoto(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Vetting Failed", description: error.message });
    } finally {
      setIsVetting(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!notesUser) return;
    setIsSavingNote(true);
    const userRef = doc(firestore, "users", notesUser.id);
    
    updateDoc(userRef, { adminNotes: noteContent })
      .then(() => {
        toast({ title: "Notes Saved", description: "Internal metadata updated." });
        setNotesUser(null);
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path, operation: 'update', requestResourceData: { adminNotes: noteContent }
        }));
      })
      .finally(() => setIsSavingNote(false));
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}?`)) {
      const docRef = doc(firestore, "users", userId);
      deleteDoc(docRef).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
      });
    }
  };

  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Role", "District", "City", "Verified"];
    const rows = filteredUsers.map(u => [
      `"${u.fullName || 'Anonymous'}"`, `"${u.email || ''}"`, `"${u.role || ''}"`, `"${u.islandGroup || ''}"`, `"${u.city || ''}"`, `"${u.isVerified ? 'Yes' : 'No'}"`
    ].join(","));
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n")));
    link.setAttribute("download", `National_Registry_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  if (loading) {
    return <div className="flex h-[80vh] w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              {isPresident ? <Crown className="h-6 w-6 md:h-8 md:w-8 text-accent animate-pulse" /> : <Globe className="h-6 w-6 md:h-8 md:w-8" />}
              {isPresident ? "National Executive Registry" : "Supporter Command Center"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isPresident ? "Full organizational oversight and jurisdictional auditing active." : "Managing recruitment pulse and regional inductions."}
            </p>
          </div>
          <Button onClick={exportToCSV} className="h-12 font-black uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 shadow-lg px-6">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-2xl border border-dashed">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-12 uppercase font-bold text-xs bg-white" placeholder="Search Identity..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterDistrict} onValueChange={setFilterDistrict}>
            <SelectTrigger className="h-12 bg-white font-bold text-xs uppercase"><Filter className="h-3 w-3 mr-2" /><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Districts</SelectItem>
              {uniqueDistricts.map(d => <SelectItem key={d} value={d} className="uppercase font-bold text-[10px]">{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="h-12 bg-white font-bold text-xs uppercase"><MapPin className="h-3 w-3 mr-2" /><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cities</SelectItem>
              {uniqueCities.map(c => <SelectItem key={c} value={c} className="uppercase font-bold text-[10px]">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-center bg-primary/5 rounded-lg border px-4 h-12">
            <span className="text-[10px] font-black uppercase text-primary/60 mr-2">Count:</span>
            <span className="text-lg font-black text-primary">{filteredUsers.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-l-4 border-l-primary bg-white"><CardContent className="p-6">
            <p className="text-[10px] font-black uppercase text-primary/60">Registry Base</p>
            <p className="text-3xl font-black text-primary">{stats.total}</p>
          </CardContent></Card>
          <Card className="shadow-lg border-l-4 border-l-emerald-600 bg-white"><CardContent className="p-6">
            <p className="text-[10px] font-black uppercase text-emerald-600/60">Verified</p>
            <p className="text-3xl font-black text-emerald-600">{stats.verified}</p>
          </CardContent></Card>
          <Card className="shadow-lg border-l-4 border-l-orange-600 bg-white"><CardContent className="p-6">
            <p className="text-[10px] font-black uppercase text-orange-600/60">Pending Audit</p>
            <p className="text-3xl font-black text-orange-600">{stats.pending}</p>
          </CardContent></Card>
        </div>

        <Card className="shadow-2xl overflow-hidden border-none bg-white">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Active Induction Log</CardTitle>
            <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase">
              {isPresident ? "ROLE: NATIONAL OVERVIEW" : "ROLE: SUPPORTERS"}
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/50 border-b">
                <TableHead className="pl-6 text-[10px] font-black uppercase">Profile</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Location</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Engagement</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Role Management</TableHead>
                <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-24 text-muted-foreground italic">No active records found in this scope.</TableCell></TableRow>
                ) : (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback className="font-black">{user.fullName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div><div className="font-black text-sm uppercase text-primary leading-tight">{user.fullName}</div><div className="text-[9px] font-bold text-muted-foreground uppercase">{user.email}</div></div>
                        </div>
                      </TableCell>
                      <TableCell><div className="text-[11px] font-black text-primary uppercase">{user.city || 'Not Set'}</div><div className="text-[9px] font-bold text-muted-foreground uppercase">{user.islandGroup || 'District'}</div></TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <Badge className="text-[8px] font-black uppercase bg-emerald-600">{user.vettingLevel || 'Verified'}</Badge>
                        ) : <Badge variant="outline" className="text-[8px] font-black uppercase opacity-50">Pending Audit</Badge>}
                      </TableCell>
                      <TableCell><div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase"><Activity className="h-3 w-3 text-accent" />{user.lastActive?.toDate ? formatDistanceToNow(user.lastActive.toDate(), { addSuffix: true }) : 'Never'}</div></TableCell>
                      <TableCell>
                        <Select defaultValue={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                          <SelectTrigger className="h-9 w-32 text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent>{PROMOTABLE_ROLES.map(r => <SelectItem key={r} value={r} className="text-[10px] font-bold uppercase">{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary rounded-full" onClick={() => window.open(`mailto:${user.email}`, '_blank')}><Mail className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 rounded-full" onClick={() => { setVettingUser(user); setVettingLevel(user.vettingLevel || "Bronze"); }}><Shield className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary rounded-full" onClick={() => { setNotesUser(user); setNoteContent(user.adminNotes || ""); }}><FileEdit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-full" onClick={() => handleDelete(user.id, user.fullName)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* SINGLE INSTANCE VETTING DIALOG */}
        <Dialog open={!!vettingUser} onOpenChange={(open) => !open && setVettingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2"><Shield className="h-5 w-5 text-accent" />Executive Vetting: {vettingUser?.fullName}</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase">Identity verification and tier assessment.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Vetting Tier</Label>
                <Select onValueChange={setVettingLevel} value={vettingLevel}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze" className="text-xs font-bold uppercase">Bronze (Basic)</SelectItem>
                    <SelectItem value="Silver" className="text-xs font-bold uppercase">Silver (Background Checked)</SelectItem>
                    <SelectItem value="Gold" className="text-xs font-bold uppercase">Gold (Executive Approved)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Upload Government ID</Label>
                <Input type="file" accept="image/*" className="h-12 pt-2 text-xs" onChange={(e) => setIdPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full font-black h-14 uppercase tracking-widest" onClick={handleVetting} disabled={isVetting}>
                {isVetting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm Vetting Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SINGLE INSTANCE NOTES DIALOG */}
        <Dialog open={!!notesUser} onOpenChange={(open) => !open && setNotesUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline uppercase text-primary">Tactical Briefing: {notesUser?.fullName}</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase">Secure metadata archiving.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Strategic Overview</Label>
                <Textarea placeholder="Internal notes on mobilization potential..." className="min-h-[150px] text-sm" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full font-black h-12 uppercase tracking-widest" onClick={handleUpdateNotes} disabled={isSavingNote}>
                {isSavingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Secure Log"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
