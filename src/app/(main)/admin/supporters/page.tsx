
"use client";

import { useCollection, useFirestore } from "@/firebase";
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
  Mail, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert,
  TrendingUp,
  ShieldCheck,
  Clock,
  Activity,
  MapPin,
  Globe,
  Filter
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const PROMOTABLE_ROLES = ["Supporter", "Volunteer", "Coordinator", "Moderator", "Member", "Officer"];

/**
 * @fileOverview Recruitment & Regional Command Dashboard.
 * Manages organizational hierarchy with advanced geographic filtering.
 */
export default function AdminSupporterDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: users, loading } = useCollection('users', {
    queries: [{ attribute: 'isAdmin', operator: '==', value: false }]
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterCity, setFilterCity] = useState("All");

  // 1. Extract unique cities and districts for filter options
  const uniqueDistricts = useMemo(() => {
    const districts = new Set(users.map(u => u.islandGroup).filter(Boolean));
    return Array.from(districts).sort();
  }, [users]);

  const uniqueCities = useMemo(() => {
    const cities = new Set(users.map(u => u.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [users]);

  // 2. Advanced Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter(s => {
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
  }, [users, searchTerm, filterDistrict, filterCity]);

  // 3. Dynamic Metrics (reflects filters)
  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const verified = filteredUsers.filter(s => s.isVerified === true).length;
    const pending = total - verified;
    const supporters = filteredUsers.filter(u => u.role === 'Supporter').length;
    return { total, verified, pending, supporters };
  }, [filteredUsers]);

  const handleRoleChange = (userId: string, newRole: string) => {
    const userRef = doc(firestore, "users", userId);
    updateDoc(userRef, { role: newRole })
      .then(() => toast({ title: "Rank Updated", description: `Member promoted to ${newRole}.` }))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path, operation: 'update', requestResourceData: { role: newRole }
        }));
      });
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    const userRef = doc(firestore, "users", userId);
    const newStatus = !currentStatus;
    updateDoc(userRef, { isVerified: newStatus })
      .then(() => toast({ title: newStatus ? "Member Verified" : "Verification Revoked" }))
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path, operation: 'update', requestResourceData: { isVerified: newStatus }
        }));
      });
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}? This is irreversible.`)) {
      const docRef = doc(firestore, "users", userId);
      deleteDoc(docRef)
        .then(() => toast({ title: "Record Removed" }))
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
        });
    }
  };

  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Role", "District", "City", "Joined Date", "Verified"];
    const rows = filteredUsers.map(user => [
      `"${user.fullName || 'Anonymous'}"`,
      `"${user.email || ''}"`,
      `"${user.role || ''}"`,
      `"${user.islandGroup || ''}"`,
      `"${user.city || ''}"`,
      `"${user.joinedAt?.toDate ? format(user.joinedAt.toDate(), 'yyyy-MM-dd') : ''}"`,
      `"${user.isVerified ? 'Yes' : 'No'}"`
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `PDDS_Regional_Report_${filterDistrict}_${filterCity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Regional Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Regional Filters */}
        <div className="flex flex-col gap-6 border-b-2 border-primary pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
                <Globe className="h-6 w-6 md:h-8 md:w-8" />
                Regional Command
              </h1>
              <p className="text-muted-foreground text-sm mt-1 font-medium italic">Geographic Distribution & Rank Management.</p>
            </div>
            <Button onClick={exportToCSV} className="h-12 font-black uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 shadow-lg px-6">
              <Download className="mr-2 h-4 w-4" /> Export Region CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 uppercase font-bold text-xs bg-white" 
                placeholder="Search Name or Email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                <SelectTrigger className="h-12 bg-white font-bold text-xs uppercase">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-primary" />
                    <SelectValue placeholder="All Districts" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Districts (Philippines)</SelectItem>
                  {uniqueDistricts.map(d => <SelectItem key={d} value={d} className="uppercase font-bold text-[10px]">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="h-12 bg-white font-bold text-xs uppercase">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-primary" />
                    <SelectValue placeholder="All Cities" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Cities / Municipalities</SelectItem>
                  {uniqueCities.map(c => <SelectItem key={c} value={c} className="uppercase font-bold text-[10px]">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center bg-primary/5 rounded-lg border border-primary/5 px-4 h-12">
              <span className="text-[10px] font-black uppercase text-primary/60 mr-2">Matches:</span>
              <span className="text-lg font-black text-primary">{filteredUsers.length}</span>
            </div>
          </div>
        </div>

        {/* 📊 Metrics Summary (Filtered) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-l-4 border-l-primary bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Target Base</p>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 mb-1">Audit Queue</p>
                <p className="text-3xl font-black text-orange-600">{stats.pending.toLocaleString()}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-600/20" />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-accent bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent/60 mb-1">Supporters</p>
                <p className="text-3xl font-black text-accent">{stats.supporters.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent/20" />
            </CardContent>
          </Card>
        </div>

        {/* Command Table */}
        <Card className="shadow-2xl overflow-hidden border-none bg-white">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Organizational Registry
            </CardTitle>
            <Badge variant="outline" className="border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3">
              {filterDistrict === "All" ? "National View" : `${filterDistrict} District`}
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Profile</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">City / District</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Assign Rank</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Last Active</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Verification</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground italic">
                      No matching records in this region.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => {
                    const lastActiveRelative = user.lastActive?.toDate ? formatDistanceToNow(user.lastActive.toDate(), { addSuffix: true }) : 'Never';
                    
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
                            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2">
                              {user.islandGroup || 'Luzon'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                            <SelectTrigger className="h-9 w-32 text-[10px] font-black uppercase border-primary/20 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROMOTABLE_ROLES.map(role => <SelectItem key={role} value={role} className="text-[10px] font-bold uppercase">{role}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase opacity-60">
                            <Activity className="h-3 w-3 text-accent" />
                            {lastActiveRelative}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={() => handleToggleVerification(user.id, !!user.isVerified)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                              user.isVerified ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {user.isVerified ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right pr-6">
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
