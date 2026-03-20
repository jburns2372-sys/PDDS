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
    FileCheck, 
    Download,
    Star,
    Shield,
    Loader2
} from "lucide-react";
import Confetti from "react-confetti";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// --- TACTICAL RECEIPT TEMPLATE (FOR PDF CAPTURE) ---
const OfficialReceiptTemplate = ({ member, amount, transactionId }: any) => {
    return (
      <div 
        id="pdds-receipt-capture"
        className="w-[800px] bg-white p-12 text-slate-900 font-sans relative overflow-hidden"
      >
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-45deg]">
          <p className="text-9xl font-black uppercase">AUTHENTIC COPY</p>
        </div>
  
        {/* Header */}
        <div className="border-b-4 border-[#002366] pb-6 mb-10 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="bg-[#002366] p-3 rounded-xl">
              <Shield className="h-8 w-8 text-[#B8860B]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-[#002366]">FEDERALISMO NG DUGONG DAKILANG SAMAHAN</h1>
              <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">National Command Headquarters • Financial Division</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-300 uppercase">Serial No.</p>
            <p className="font-mono text-sm font-bold text-[#B8860B]">{transactionId}</p>
          </div>
        </div>
  
        {/* Document Body */}
        <div className="space-y-8 relative z-10">
          <div className="text-center space-y-1">
            <h2 className="text-4xl font-black uppercase tracking-tight text-[#002366]">Official Receipt</h2>
            <p className="text-xs font-bold text-slate-400 italic">Certification of Contribution & Standing</p>
          </div>
  
          <div className="grid grid-cols-2 gap-12 mt-12 border-y py-10 border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase">Received From</label>
                <p className="text-xl font-black text-[#002366] uppercase">{member?.fullName}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase">Chapter / Location</label>
                <p className="text-sm font-bold uppercase">{member?.city || "National Hub"}, {member?.province || "PH"}</p>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase">Amount Cleared</label>
                <p className="text-3xl font-black text-emerald-600">₱{amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase">Date of Settlement</label>
                <p className="text-sm font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
  
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-[10px] leading-relaxed text-slate-500 text-justify italic">
              This document serves as formal confirmation that the aforementioned Patriot has settled their Annual Membership Dues for the 2026 cycle. This contribution supports the operational capabilities of the National Command. Subject is hereby recognized as in <strong>Good Standing</strong> and granted full access to samahan assets.
            </p>
          </div>
        </div>
  
        {/* Footer */}
        <div className="mt-20 flex justify-between items-center">
          <div className="space-y-1">
            <div className="w-48 h-px bg-slate-300 mb-2" />
            <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Office of the Secretary-General</p>
            <p className="text-[8px] text-slate-300">Authorized Electronic Signature</p>
          </div>
          <div className="border-4 border-[#B8860B]/20 rounded-full p-2">
              <div className="border-2 border-[#B8860B]/40 rounded-full p-4 flex items-center justify-center">
                  <p className="text-[10px] font-black text-[#B8860B] uppercase rotate-[-15deg] tracking-widest">CERTIFIED</p>
              </div>
          </div>
        </div>
      </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function PaymentSuccessPage() {
    const router = useRouter();
    const { userData, loading } = useUserData();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    const downloadReceipt = async () => {
        setIsDownloading(true);
        const element = document.getElementById("pdds-receipt-capture");
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("l", "px", [800, 600]); 
            pdf.addImage(imgData, "PNG", 0, 0, 800, 600);
            pdf.save(`PDDS_Receipt_${userData?.fullName?.replace(/\s+/g, '_') || 'Member'}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
            
            {/* Hidden Template for PDF Capture */}
            <div className="absolute top-[-9999px] left-[-9999px]">
                <OfficialReceiptTemplate 
                    member={userData} 
                    amount={200} 
                    transactionId={`TXN-${Date.now().toString().slice(-8)}`} 
                />
            </div>

            <Confetti 
                width={windowSize.width} 
                height={windowSize.height} 
                recycle={false} 
                numberOfPieces={200}
                colors={['#002366', '#B8860B', '#E2E8F0']}
            />

            <Card className="max-w-xl w-full border-none shadow-[0_32px_64px_-15px_rgba(0,35,102,0.2)] rounded-[40px] overflow-hidden bg-white">
                <div className="bg-[#002366] p-8 text-center relative overflow-hidden">
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
                            disabled={isDownloading}
                            onClick={downloadReceipt}
                            className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-[#002366] hover:bg-transparent"
                        >
                            {isDownloading ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-3 w-3 mr-2" />
                            )}
                            {isDownloading ? "Generating Intelligence..." : "Download Official Receipt"}
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