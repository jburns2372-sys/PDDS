"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserData } from "@/context/user-data-context";
import { 
    ShieldCheck, 
    ArrowRight, 
    PartyPopper, 
    FileCheck, 
    Download,
    Star
} from "lucide-react";
import Confetti from "react-confetti";
import { cn } from "@/lib/utils";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const { userData, loading } = useUserData();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    if (loading) return null;

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
            {/* Success Celebration */}
            <Confetti 
                width={windowSize.width} 
                height={windowSize.height} 
                recycle={false} 
                numberOfPieces={200}
                colors={['#002366', '#B8860B', '#E2E8F0']}
            />

            <Card className="max-w-xl w-full border-none shadow-[0_32px_64px_-15px_rgba(0,35,102,0.2)] rounded-[40px] overflow-hidden bg-white">
                <div className="bg-[#002366] p-8 text-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] mb-4 animate-bounce">
                            <ShieldCheck className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Contribution Verified</h1>
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mt-2">National Command Registry Hub</p>
                    </div>
                </div>

                <CardContent className="p-8 space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Patriot Identity</p>
                            <h2 className="text-xl font-black text-[#002366] uppercase">{userData?.fullName}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Current Status</p>
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 font-black px-4 py-1">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                ACTIVE DUTY
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-6 border-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                <FileCheck className="h-5 w-5 text-[#B8860B]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#002366] uppercase">2026 Annual Dues</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Transaction Completed via PayMongo</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-[#002366]">₱200.00</span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Approved & Logged</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button 
                            onClick={() => router.push('/home')}
                            className="w-full h-14 bg-[#002366] hover:bg-[#001a4d] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            Return to Command Center
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-[#002366] hover:bg-transparent"
                        >
                            <Download className="h-3 w-3 mr-2" />
                            Download Official Receipt
                        </Button>
                    </div>
                </CardContent>
                
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        Document generated by PatriotLink Intelligence Unit • {new Date().toLocaleDateString()}
                    </p>
                </div>
            </Card>
        </div>
    );
}