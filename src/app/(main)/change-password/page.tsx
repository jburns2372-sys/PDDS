"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { updatePassword } from "firebase/auth";
import { updateUserDocument } from "@/firebase/firestore/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }
    if (newPassword.length < 6) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Password must be at least 6 characters long.",
        });
        return;
    }

    setLoading(true);

    if (!user) {
        toast({ variant: "destructive", title: "Not Authenticated" });
        setLoading(false);
        router.push('/login');
        return;
    }

    try {
        await updatePassword(user, newPassword);
        await updateUserDocument(firestore, user.uid, { passwordIsTemporary: false });

        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
        router.push("/home");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleChangePassword}>
          <CardHeader>
            <CardTitle className="text-2xl text-center font-headline">Create New Password</CardTitle>
            <CardDescription className="text-center">
              Please create a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating Password..." : "Set New Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
