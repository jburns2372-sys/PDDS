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
import { Search } from "lucide-react";
import type { UserProfile } from "@/context/user-data-context";
import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

const roles = [
  "System Admin", "Admin", "Chairman", "Vice Chairman", "President", 
  "Vice President", "Secretary General", "Treasurer", "Auditor", 
  "VP Ways & Means", "VP Media Comms", "VP Soc Med Comms", "VP Events & Programs", 
  "VP Membership", "VP Legal Affairs", "Member"
];
const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

function UserRow({ user, onSave, onRevoke }: { user: UserProfile, onSave: (u: UserProfile) => void, onRevoke: (u: UserProfile) => void }) {
  const [role, setRole] = useState(user.role);
  const [level, setLevel] = useState(user.level);
  const [locationName, setLocationName] = useState(user.locationName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ ...user, role, level, locationName });
    setIsSaving(false);
  };
  
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{user.fullName}</div>
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
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input value={locationName || ''} onChange={(e) => setLocationName(e.target.value)} className="w-48" />
      </TableCell>
      <TableCell className="space-x-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
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
    return users.filter(user =>
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSaveUser = async (userToSave: UserProfile) => {
    try {
      const { id, ...dataToUpdate } = userToSave;
      await updateUserDocument(firestore, id, dataToUpdate);
      toast({ title: "User Updated", description: `${userToSave.fullName}'s profile has been updated.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    }
  };

  const handleRevokeAccess = async (userToRevoke: UserProfile) => {
    // In a real app, this would likely involve disabling the user in Firebase Auth
    // and/or deleting their user document. For now, we'll just show a toast.
    console.log("Revoking access for", userToRevoke);
    toast({ variant: "destructive", title: "Access Revoked (Simulated)", description: `Access for ${userToRevoke.fullName} has been revoked.` });
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
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search members by name or email..."
          className="pl-8 w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
            {filteredUsers.map(user => (
              <UserRow key={user.id} user={user} onSave={handleSaveUser} onRevoke={handleRevokeAccess} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
