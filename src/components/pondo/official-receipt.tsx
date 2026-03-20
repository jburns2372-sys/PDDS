import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptProps {
  member: any;
  amount: number;
  transactionId: string;
}

export const OfficialReceiptTemplate = ({ member, amount, transactionId }: ReceiptProps) => {
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
          <p className="font-mono text-sm font-bold text-[#B8860B]">{transactionId.slice(0, 12).toUpperCase()}</p>
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
              <p className="text-sm font-bold uppercase">{member?.city}, {member?.province}</p>
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

        <div className="bg-slate-50 p-6 rounded-2xl">
          <p className="text-[10px] leading-relaxed text-slate-500 text-justify italic">
            This document serves as formal confirmation that the aforementioned Patriot has settled their Annual Membership Dues for the 2026 cycle. This contribution supports the operational capabilities of the National Command. Subject is hereby recognized as in <strong>Good Standing</strong> and granted full access to samahan assets and intelligence vaults.
          </p>
        </div>
      </div>

      {/* Footer / Seal */}
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