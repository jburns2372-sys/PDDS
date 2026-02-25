"use client";

import { useUserData } from "@/context/user-data-context";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user } = useUserData();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    }

  return (
    <div className="flex flex-col">
      <div className="bg-card p-6 md:p-8 border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your member profile and settings.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-4">
        <div className="bg-card p-4 rounded-lg border">
            <p><strong>Email:</strong> {user?.email}</p>
        </div>
        <Button onClick={handleLogout} variant="destructive">
            Logout
        </Button>
      </div>
    </div>
  );
}
