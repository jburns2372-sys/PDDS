
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/home");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message,
            });
            setLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/30 p-4 relative">
        {loading && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse text-center px-4 font-headline">
                    Accessing the national registry...
                </p>
            </div>
        )}

        <div className="mb-8 flex items-center gap-4">
            <PddsLogo className="h-16 w-16" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase">
                PDDS Portal
            </h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary bg-white">
        <CardHeader>
            <CardTitle className="text-2xl text-center font-headline uppercase">Member Login</CardTitle>
            <CardDescription className="text-center font-medium text-muted-foreground">Access your PDDS War Room account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Email Address</Label>
                    <Input id="email" type="email" placeholder="m.delacruz@example.com" className="h-12 font-bold" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Password</Label>
                    <Input id="password" type="password" className="h-12" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-xl" disabled={loading}>
                    {loading ? "Verifying..." : "Sign In"}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center w-full">
                <p className="text-sm text-muted-foreground font-medium">
                    Not a member yet? <Link href="/join" className="text-primary font-black hover:underline uppercase text-xs tracking-widest">Join the Movement</Link>
                </p>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
