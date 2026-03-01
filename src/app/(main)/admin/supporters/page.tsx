
"use client";

import { useCollection, useFirestore } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Search, User, Mail, CalendarDays, Download, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * @fileOverview Supporter Recruitment Dashboard with Management Capabilities.
 * Displays real-time list of all supporters.
 * Includes Search, CSV Export, and Administrative Removal.
 */
export default function AdminSupporterDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // 1. Fetch only 'Supporter' roles using real-time listener
  const { data: supporters, loading } = useCollection('users', {
    queries: [{ attribute: 'role', operator: '==', value: 'Supporter' }]
  });

  const [searchTerm, setSearchTerm] = useState("");

  // 2. Search logic: Filter by Full Name or Email
  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => 
      (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a: any, b: any) => {
      const dateA = a.joinedAt?.seconds || a.createdAt?.seconds || 0;
      const dateB = b.joinedAt?.seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [supporters, searchTerm]);

  // 🗑️ The Delete Function (With Confirmation)
  const handleDelete = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove ${userName} from the PDDS National Registry? This action is irreversible.`);
    
    if (confirmDelete) {
      const docRef = doc(firestore, "users", userId);
      
      // NO await here - Pattern 1 for mutations
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
    const headers = ["Full Name", "Email", "Joined Date", "Role"];
    const rows = filteredSupporters.map(user => {
      const joinDate = user.joinedAt?.toDate ? user.joinedAt.toDate() : 
                       user.createdAt?.toDate ? user.createdAt.toDate() : 
                       user.createdAt ? new Date(user.createdAt) : new Date();
      
      return [
        `"${user.fullName || 'Anonymous'}"`,
        `"${user.email || ''}"`,
        `"${format(joinDate, 'yyyy-MM-dd')}"`,
        `"${user.role || 'Supporter'}"`
      ].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PDDS_Supporters_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
            Syncing Recruitment Logs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
              PDDS Recruitment Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium italic">Command Center: Monitoring real-time induction of new advocates.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 uppercase font-bold text-xs border-primary/20 shadow-sm focus:ring-accent" 
                placeholder="Search by Name or Email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={exportToCSV}
              className="h-12 w-full sm:w-auto font-black uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 shadow-lg px-6"
              disabled={filteredSupporters.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Supporters Table */}
        <Card className="shadow-2xl overflow-hidden border-none bg-white">
          <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <User className="h-4 w-4" />
              Verified Registrations ({filteredSupporters.length})
            </CardTitle>
            <Badge variant="outline" className="border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3">
              National Base
            </Badge>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b">
                <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Photo</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Full Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Email Address</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Induction Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Official Rank</TableHead>
                <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSupporters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Search className="h-8 w-8" />
                      <p className="font-bold uppercase text-xs tracking-widest">No supporters found matching your search criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSupporters.map((user: any) => {
                  const joinDate = user.joinedAt?.toDate ? user.joinedAt.toDate() : 
                                 user.createdAt?.toDate ? user.createdAt.toDate() : 
                                 user.createdAt ? new Date(user.createdAt) : new Date();
                  
                  return (
                    <TableRow key={user.uid || user.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="pl-6">
                        <Avatar className="h-10 w-10 border-2 border-primary/5 shadow-sm group-hover:scale-110 transition-transform">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black">
                            {user.fullName?.charAt(0) || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-sm uppercase text-primary leading-tight">{user.fullName}</div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 flex items-center gap-1">
                          <Users className="h-2.5 w-2.5" /> ID: {user.uid?.substring(0, 8).toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 text-primary/30" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 text-primary/40" />
                          {format(joinDate, 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 shadow-sm border-none">
                          Supporter
                        </Badge>
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
        </Card>
      </div>
    </div>
  );
}
