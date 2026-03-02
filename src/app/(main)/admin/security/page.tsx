
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, doc, deleteDoc, updateDoc, serverTimestamp, addDoc, query, orderBy, limit } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldAlert, 
  Trash2, 
  Loader2, 
  Lock, 
  History, 
  UserMinus, 
  FileSearch, 
  Activity, 
  Terminal,
  Database,
  Search,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";

/**
 * @fileOverview Sec-Gen Security & Data Command.
 * Handles "Right to be Forgotten" erasure and forensic access logs.
 */
export default function SecGenSecurityPage() {
  const { userData: currentSecGen } = useUserData();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const { data: logs, loading: logsLoading } = useCollection('security_logs');
  const { data: users, loading: usersLoading } = useCollection('users');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isWiping, setIsWiping] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleErasure = async (user: any) => {
    const confirmation = prompt(`CRITICAL: Type "ERASE ${user.fullName.toUpperCase()}" to execute Right to be Forgotten protocol. This will wipe all identity evidence.`);
    if (confirmation !== `ERASE ${user.fullName.toUpperCase()}`) return;

    setIsWiping(user.id);
    try {
      // 1. Wipe Binary Assets from Storage
      if (user.idVerificationUrl) {
        const idRef = ref(storage, `id_verifications/${user.id}`);
        await deleteObject(idRef).catch(() => console.log("No ID file found."));
      }
      
      const profilePhotoRef = ref(storage, `users/${user.id}/profile.jpg`);
      await deleteObject(profilePhotoRef).catch(() => console.log("No profile photo found."));

      // 2. Anonymize User Document in Firestore
      const userRef = doc(firestore, "users", user.id);
      await updateDoc(userRef, {
        fullName: "ANONYMIZED_PATRIOT",
        email: `deleted_${user.id}@anonymized.pdds`,
        phoneNumber: null,
        photoURL: null,
        idVerificationUrl: null,
        isVerified: false,
        status: "ERASED_BY_SECGEN",
        erasedAt: serverTimestamp(),
        erasedBy: currentSecGen?.fullName
      });

      // 3. Log Forensics
      await addDoc(collection(firestore, "security_logs"), {
        adminUid: currentSecGen?.uid,
        adminName: currentSecGen?.fullName,
        action: "RIGHT_TO_BE_FORGOTTEN_EXECUTED",
        targetUid: user.id,
        timestamp: serverTimestamp(),
        systemLevel: "PRIVACY_PROTOCOL"
      });

      toast({ title: "Protocol Complete", description: "Identity data purged from National Registry." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Protocol Failed", description: e.message });
    } finally {
      setIsWiping(null);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] text-white min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center gap-5 border-b-2 border-red-500/30 pb-8">
          <div className="p-4 bg-red-600/20 text-red-400 rounded-2xl border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-headline uppercase tracking-tighter text-red-400">Security Control Center</h1>
            <p className="text-red-700 font-bold uppercase text-[10px] tracking-widest mt-1">Classified: Sec-Gen Forensic Oversight Active</p>
          </div>
        </div>

        <Tabs defaultValue="forensics" className="space-y-8">
          <TabsList className="bg-red-950/20 p-1 border border-red-500/20 h-14 justify-start">
            <TabsTrigger value="forensics" className="px-8 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-black">
              <Terminal className="h-4 w-4 mr-2" /> Access Forensics
            </TabsTrigger>
            <TabsTrigger value="privacy" className="px-8 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-black">
              <UserMinus className="h-4 w-4 mr-2" /> Privacy Protocols
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forensics" className="space-y-6 animate-in fade-in duration-500">
            <Card className="bg-[#111] border-red-500/20 shadow-2xl overflow-hidden font-mono">
              <CardHeader className="bg-red-950/30 border-b border-red-500/20">
                <CardTitle className="text-xs font-black uppercase text-red-500 flex items-center gap-2">
                  <Activity className="h-4 w-4 animate-pulse" />
                  Real-Time Security Event Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-red-500/10">
                      <TableHead className="text-red-900 font-black uppercase text-[10px]">Timestamp</TableHead>
                      <TableHead className="text-red-900 font-black uppercase text-[10px]">Operator</TableHead>
                      <TableHead className="text-red-900 font-black uppercase text-[10px]">Action Protocol</TableHead>
                      <TableHead className="text-red-900 font-black uppercase text-[10px]">Target Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow><TableCell colSpan={4} className="py-12 text-center text-red-900">SYNCHRONIZING_LOGS...</TableCell></TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="py-12 text-center text-red-900 italic">NO_EVENTS_LOGGED</TableCell></TableRow>
                    ) : (
                      [...logs].sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map(log => (
                        <TableRow key={log.id} className="border-b border-red-500/5 hover:bg-red-500/5">
                          <TableCell className="text-[10px] text-red-400/60">[{log.timestamp ? format(log.timestamp.toDate(), 'HH:mm:ss.SS') : '...'}]</TableCell>
                          <TableCell className="text-[10px] text-red-400 font-bold">{log.adminName || 'SYSTEM'}</TableCell>
                          <TableCell><Badge className="bg-red-950 text-red-500 border border-red-500/30 text-[8px]">{log.action}</Badge></TableCell>
                          <TableCell className="text-[10px] text-red-900">ID://{log.targetUid?.substring(0, 16)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-red-950/20 p-6 rounded-2xl border-2 border-dashed border-red-500/30 flex items-start gap-4">
              <ShieldAlert className="h-10 w-10 text-red-500 shrink-0" />
              <div>
                <h3 className="text-lg font-black uppercase text-red-500">Right to be Forgotten Execution</h3>
                <p className="text-sm text-red-400/60 mt-1 leading-relaxed max-w-3xl">
                  Authorized Sec-Gen protocol to purge all biometric and identity evidence for members exercising their DPA 2012 rights. Metadata is retained for historical party statistics but all identifiable links are destroyed.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500/50" />
              <input 
                className="w-full bg-red-950/10 border-2 border-red-500/20 rounded-2xl h-16 pl-12 pr-4 text-sm font-bold uppercase text-red-400 focus:outline-none focus:border-red-500/50 transition-all"
                placeholder="Search Identity Record for Erasure..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usersLoading ? (
                <div className="col-span-full py-24 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-red-500" /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="col-span-full py-24 text-center text-red-900 font-black uppercase">Identity not found in Registry.</div>
              ) : (
                filteredUsers.map(user => (
                  <Card key={user.id} className="bg-[#111] border-red-500/10 hover:border-red-500/30 transition-all group overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-2 border-red-500/20 bg-red-950 flex items-center justify-center font-black text-red-500">
                          {user.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase text-red-400 leading-none">{user.fullName}</p>
                          <p className="text-[10px] text-red-900 font-bold uppercase mt-1">{user.city} Chapter</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-red-500/10 flex justify-between items-center">
                        <div className="text-[8px] font-black uppercase text-red-900">Clearance: {user.role}</div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-9 px-4 font-black uppercase text-[10px] bg-red-900 hover:bg-red-600 text-white"
                          onClick={() => handleErasure(user)}
                          disabled={isWiping === user.id}
                        >
                          {isWiping === user.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
                          Erase Identity
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
