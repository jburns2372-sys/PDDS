"use client";

import { useCollection } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Search, MapPin, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

/**
 * @fileOverview Supporter Recruitment Dashboard.
 * Displays real-time list of all supporters registered in the National Registry.
 */
export default function AdminSupporterDashboard() {
  const { data: supporters, loading } = useCollection('users', {
    queries: [{ attribute: 'role', operator: '==', value: 'Supporter' }]
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => 
      (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a: any, b: any) => {
      const dateA = a.joinedAt?.seconds || a.createdAt?.seconds || 0;
      const dateB = b.joinedAt?.seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [supporters, searchTerm]);

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
              Supporter Recruitment List
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time tracking of new movement advocates nationwide.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10 h-12 uppercase font-bold text-xs border-primary/20" 
              placeholder="Search supporters..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="shadow-xl overflow-hidden border-none bg-white">
          <CardHeader className="bg-primary text-primary-foreground py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Registrations ({filteredSupporters.length})
              </CardTitle>
              <Badge variant="outline" className="border-white/20 text-white text-[9px] font-black uppercase">
                National Base
              </Badge>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b">
                <TableHead className="pl-6 text-[10px] font-black uppercase">Advocate</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Jurisdiction</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Joined On</TableHead>
                <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Induction Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSupporters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">
                    No matching supporters found in the registry.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSupporters.map((user: any) => {
                  const joinDate = user.joinedAt?.toDate ? user.joinedAt.toDate() : 
                                 user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
                  
                  return (
                    <TableRow key={user.uid || user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                              {user.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-black text-sm uppercase text-primary leading-tight">{user.fullName}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary/40" />
                          <div className="text-[11px] font-bold uppercase">{user.city || 'National'}</div>
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase pl-4.5">{user.province || 'Registry'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <CalendarDays className="h-3 w-3 text-primary/40" />
                          {format(joinDate, 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className="bg-accent text-accent-foreground text-[9px] font-black uppercase tracking-widest px-2">
                          Supporter
                        </Badge>
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