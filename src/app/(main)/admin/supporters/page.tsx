
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
  Globe
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
 * @fileOverview Recruitment & Command Dashboard.
 * Manages the transition of Supporters to official Ranks (Member/Officer/Coordinator).
 * Displays real-time induction stats and regional distribution.
 */
export default function AdminSupporterDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // 1. Fetch all non-admin users for hierarchical management
  const { data: users, loading } = useCollection('users', {
    queries: [{ attribute: 'isAdmin', operator: '==', value: false }]
  });

  const [searchTerm, setSearchTerm] = useState("");

  // 2. Metrics Calculation
  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter(s => s.isVerified === true).length;
    const pending = total - verified;
    const supporters = users.filter(u => u.role === 'Supporter').length;
    return { total, verified, pending, supporters };
  }, [users]);

  // 3. Search logic: Filter by Full Name, Email, or District
  const filteredUsers = useMemo(() => {
    return users.filter(s => 
      (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.islandGroup || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a: any, b: any) => {
      const dateA = a.lastActive?.seconds || a.joinedAt?.seconds || a.createdAt?.seconds || 0;
      const dateB = b.lastActive?.seconds || b.joinedAt?.seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [users, searchTerm]);

  // 🆙 The Role Promotion Function
  const handleRoleChange = (userId: string, newRole: string) => {
    const userRef = doc(firestore, "users", userId);
    
    updateDoc(userRef, { role: newRole })
      .then(() => {
        toast({
          title: "Rank Updated",
          description: `User has been promoted to ${newRole}.`
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { role: newRole }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  // ✅ The Toggle Verification Function
  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    const userRef = doc(firestore, "users", userId);
    const newStatus = !currentStatus;
    
    updateDoc(userRef, { isVerified: newStatus })
      .then(() => {
        toast({
          title: newStatus ? "Member Verified" : "Verification Revoked",
          description: `Registry status updated successfully.`
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { isVerified: newStatus }
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  // 🗑️ The Delete Function (With Confirmation)
  const handleDelete = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove ${userName} from the PDDS National Registry? This action is irreversible.`);
    
    if (confirmDelete) {
      const docRef = doc(firestore, "users", userId);
      
      deleteDoc(docRef)
        .then(() => {
          toast({
            title: "Record Removed",
            description: `${userName} has been successfully deleted from the registry.`
          });
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  // 📂 The CSV Export Function
  const exportToCSV = () => {
    const headers = ["Full Name", "Email", "Role", "District", "Location", "Joined Date", "Last Active", "Verified Status"];
    const rows = filteredUsers.map(user => {
      const joinDate = user.joinedAt?.toDate ? user.joinedAt.toDate() : 
                       user.createdAt?.toDate ? user.createdAt.toDate() : 
                       user.createdAt ? new Date(user.createdAt) : new Date();
      const activeDate = user.lastActive?.toDate ? user.lastActive.toDate() : joinDate;
      
      return [
        `"${user.fullName || 'Anonymous'}"`,
        `"${user.email || ''}"`,
        `"${user.role || ''}"`,
        `"${user.islandGroup || ''}"`,
        `"${user.city || ''}, ${user.province || ''}"`,
        `"${format(joinDate, 'yyyy-MM-dd')}"`,
        `"${format(activeDate, 'yyyy-MM-dd HH:mm')}"`,
        `"${user.isVerified ? 'Verified' : 'Unverified'}"`
      ].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PDDS_Supporters_District_Log_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Syncing District Records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
              Recruitment Command
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium italic">Role Management & Regional District Monitoring.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 uppercase font-bold text-xs border-primary/20 shadow-sm focus:ring-accent" 
                placeholder="Search by Name, Email or District..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={exportToCSV}
              className="h-12 w-full sm:w-auto font-black uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 shadow-lg px-6"
              disabled={filteredUsers.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* 📊 Metrics Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-l-4 border-l-primary bg-blue-50/30">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Total Inductions</p>
                <p className="text-3xl font-black text-primary">{stats.total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-accent bg-amber-50/30">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent/60 mb-1">Supporters</p>
                <p className="text-3xl font-black text-accent">{stats.supporters.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full text-accent">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-emerald-600 bg-emerald-50/30">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Verified Citizens</p>
                <p className="text-3xl font-black text-emerald-600">{stats.verified.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-orange-600 bg-orange-50/30">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 mb-1">Audit Queue</p>
                <p className="text-3xl font-black text-orange-600">{stats.pending.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Command Table */}
        <Card className="shadow-2xl overflow-hidden border-none bg-white">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Strategic Registry ({filteredUsers.length})
            </CardTitle>
            <Badge variant="outline" className="border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3">
              National District Control
            </Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Profile</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">District</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Assign Rank</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Engagement</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Verification</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Search className="h-8 w-8" />
                        <p className="font-bold uppercase text-xs tracking-widest">No matching induction records.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => {
                    const lastActiveRelative = user.lastActive?.toDate ? formatDistanceToNow(user.lastActive.toDate(), { addSuffix: true }) : 'Inducting...';
                    
                    return (
                      <TableRow key={user.uid || user.id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/5 shadow-sm group-hover:scale-110 transition-transform">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback className="bg-primary/5 text-primary font-black">
                                {user.fullName?.charAt(0) || <User className="h-5 w-5" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-black text-sm uppercase text-primary leading-tight">{user.fullName}</div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 flex items-center gap-1">
                                <Mail className="h-2.5 w-2.5" /> 
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2">
                              <Globe className="h-2 w-2 mr-1 text-accent" />
                              {user.islandGroup || 'Luzon'}
                            </Badge>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <MapPin className="h-2 w-2" />
                              {user.city || 'National HQ'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="h-9 w-32 text-[10px] font-black uppercase border-primary/20 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROMOTABLE_ROLES.map(role => (
                                <SelectItem key={role} value={role} className="text-[10px] font-bold uppercase">
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                            <Activity className="h-3 w-3 text-accent animate-pulse" />
                            {lastActiveRelative}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={() => handleToggleVerification(user.id, !!user.isVerified)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                              user.isVerified 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {user.isVerified ? (
                              <><CheckCircle2 className="h-3 w-3" /> Verified</>
                            ) : (
                              <><ShieldAlert className="h-3 w-3" /> Pending</>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white transition-colors rounded-full"
                            onClick={() => handleDelete(user.id, user.fullName)}
                          >
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
