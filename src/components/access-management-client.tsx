"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { updateUserDocument } from "@/firebase/firestore/firestore-service";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2 } from "lucide-react";
import type { UserProfile } from "@/context/user-data-context";
import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

const roles = [
  "President", "Chairman", "Vice Chairman", "VP", "Sec Gen", "Treasurer", "Auditor", 
  "VP Ways & Means Chair", "VP Media Comms", "VP Soc Med Comms", "VP Events and Programs", 
  "VP Membership", "VP legal affairs", "Member", "Admin", "System Admin"
];
const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

function UserRow({ user, onSave, onRevoke }: { user: UserProfile, onSave: (u: UserProfile) => void, onRevoke: (u: UserProfile) => void }) {
  const [role, setRole] = useState(user.role);
  const [jurisdictionLevel, setJurisdictionLevel] = useState(user.jurisdictionLevel || "National");
  const [assignedLocation, setAssignedLocation] = useState(user.assignedLocation || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ ...user, role, jurisdictionLevel, assignedLocation });
    setIsSaving(false);
  };
  
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{user.fullName || 'Anonymous'}</div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell>
        <Badge variant={user.kartilyaAgreed ? "secondary" : "outline"}>
          {user.kartilyaAgreed ? "Approved" : "Pending"}
        </Badge>
      </TableCell>
      <TableCell>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={jurisdictionLevel} onValueChange={setJurisdictionLevel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input value={assignedLocation} onChange={(e) => setAssignedLocation(e.target.value)} className="w-48" />
      </TableCell>
      <TableCell className="space-x-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button variant="destructive" onClick={() => onRevoke(user)}>Revoke</Button>
      </TableCell>
    </TableRow>
  );
}

export function AccessManagementClient() {
  const { data: users, loading, error } = useCollection<UserProfile>('users');
  const [searchTerm, setSearchTerm] = useState("");
  const firestore = useFirestore();
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    return (users || []).filter(user =>
      (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSaveUser = async (userToSave: UserProfile) => {
    try {
      const { id, ...dataToUpdate } = userToSave;
      await updateUserDocument(firestore, id, dataToUpdate);
      toast({ title: "User Updated", description: `${userToSave.fullName || userToSave.email}'s profile has been updated.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    }
  };

  const handleRevokeAccess = async (userToRevoke: UserProfile) => {
    console.log("Revoking access for", userToRevoke);
    toast({ variant: "destructive", title: "Access Revoked (Simulated)", description: `Access for ${userToRevoke.fullName || userToRevoke.email} has been revoked.` });
  };
  
  if (loading) {
      return (
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
              </div>
              <Skeleton className="h-[400px] w-full" />
          </div>
      )
  }

  if (error) {
    return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error loading users: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members by name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Total Members: {users?.length || 0}
          </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No members found.
                    </TableCell>
                </TableRow>
            ) : filteredUsers.map(user => (
              <UserRow key={user.id} user={user} onSave={handleSaveUser} onRevoke={handleRevokeAccess} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}