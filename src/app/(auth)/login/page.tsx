
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: any) => {
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
            router.push("/home");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Social Login Failed",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
        <div className="mb-8 flex items-center gap-4">
            <PddsLogo className="h-16 w-16" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase">
                PDDS Portal
            </h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
        <CardHeader>
            <CardTitle className="text-2xl text-center font-headline uppercase">Member Login</CardTitle>
            <CardDescription className="text-center">Access your PDDS War Room account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Social Login Section */}
            <div className="grid grid-cols-1 gap-3">
                <Button 
                    variant="outline" 
                    className="w-full bg-[#4285F4] text-white hover:bg-[#357ae8] border-none font-bold"
                    onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                    disabled={loading}
                >
                    Continue with Google
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full bg-[#1877F2] text-white hover:bg-[#166fe5] border-none font-bold"
                    onClick={() => handleSocialLogin(new FacebookAuthProvider())}
                    disabled={loading}
                >
                    Continue with Facebook
                </Button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground font-black tracking-widest">Or Use Credentials</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="m.delacruz@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-12 font-bold text-lg" disabled={loading}>
                    {loading ? "Verifying..." : "Sign In"}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center w-full">
                <p className="text-sm text-muted-foreground">
                    Not a member yet? <Link href="/join" className="text-primary font-bold hover:underline">Join the Movement</Link>
                </p>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
