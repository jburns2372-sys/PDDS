"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    ShieldCheck, 
    ShieldAlert, 
    MapPin, 
    User, 
    Calendar,
    Loader2,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicVerificationPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const verifyMember = async () => {
            try {
                const docRef = doc(firestore, "users", params.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setMember(docSnap.data());
                } else {
                    setError(true);
                }
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        verifyMember();
    }, [params.id, firestore]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
                <Loader2 className="h-12 w-12 text-[#B8860B] animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 animate-pulse">Initializing Secure Vetting...</p>
            </div>
        );
    }

    if (error || !member) {
        return (
            <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <ShieldAlert className="h-20 w-20 text-red-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Unauthorized ID</h1>
                <p className="text-red-200 text-sm max-w-xs font-bold uppercase tracking-widest opacity-60">This credential does not exist in the National Command Registry.</p>
            </div>
        );
    }

    const isActive = member.membershipStatus === "Active";

    return (
        <div className={cn(
            "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-1000",
            isActive ? "bg-slate-950" : "bg-amber-950"
        )}>
            {/* Background Security Grid */}
            <div className="fixed inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <Card className="max-w-md w-full bg-slate-900 border-2 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[40px] overflow-hidden relative z-10">
                {/* Status Banner */}
                <div className={cn(
                    "p-6 text-center border-b-2",
                    isActive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                )}>
                    <div className={cn(
                        "inline-flex items-center gap-2 px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-xs mb-2",
                        isActive ? "bg-emerald-500 text-slate-950" : "bg-amber-500 text-slate-950"
                    )}>
                        {isActive ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        {isActive ? "Verified Active" : "Status: Pending Dues"}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Credential Intelligence</p>
                </div>

                <CardContent className="p-8 space-y-8">
                    {/* Subject Identity */}
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "h-32 w-32 rounded-3xl p-1 mb-6 shadow-2xl",
                            isActive ? "bg-emerald-500" : "bg-amber-500"
                        )}>
                            <div className="h-full w-full rounded-[20px] overflow-hidden bg-slate-800">
                                <img 
                                    src={member.photoURL || "/api/placeholder/200/200"} 
                                    className="w-full h-full object-cover" 
                                    alt="Subject" 
                                />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter text-center leading-none mb-1">
                            {member.fullName}
                        </h2>
                        <p className="text-[#B8860B] font-black uppercase tracking-widest text-sm italic">{member.role}</p>
                    </div>

                    {/* Vetting Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Jurisdiction</p>
                            <div className="flex items-center gap-2 text-slate-200">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] font-bold uppercase">{member.city || "National"}</span>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Registry Year</p>
                            <div className="flex items-center gap-2 text-slate-200">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] font-bold uppercase">Cycle 2026</span>
                            </div>
                        </div>
                    </div>

                    {/* Security Note */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex gap-4 items-start">
                        <Lock className="h-4 w-4 text-slate-600 mt-1 shrink-0" />
                        <p className="text-[9px] leading-relaxed text-slate-500 text-justify italic font-medium">
                            The identity above has been verified through the PDDS National Command Registry. All ₱200.00 cycle dues have been authorized and the subject is currently in <strong>Good Standing</strong>. Authorized personnel may proceed with clearance.
                        </p>
                    </div>
                </CardContent>

                <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800 flex flex-col items-center gap-1">
                    <Shield className="h-4 w-4 text-slate-700" />
                    <p className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.3em]">
                        Official PDDS National Security Portal
                    </p>
                </div>
            </Card>
        </div>
    );
}