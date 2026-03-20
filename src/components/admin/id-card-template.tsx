import { Shield, MapPin, Star } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export const IDCardTemplate = ({ member }: { member: any }) => {
  return (
    <div 
      id={`id-card-${member.id}`}
      className="w-[350px] h-[550px] bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative border-[12px] border-[#002366]"
    >
      {/* Top Header */}
      <div className="bg-[#002366] p-6 text-center space-y-1 relative">
        <div className="absolute top-2 right-4">
            <Star className="h-4 w-4 text-[#B8860B] fill-current opacity-50" />
        </div>
        <Shield className="h-8 w-8 text-[#B8860B] mx-auto mb-2" />
        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">National Command</h2>
        <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Official Identification</p>
      </div>

      {/* Subject Photo */}
      <div className="flex-1 flex flex-col items-center pt-8 px-6 space-y-4">
        <div className="h-40 w-40 rounded-3xl border-4 border-[#002366] overflow-hidden bg-slate-100 shadow-xl">
           <img 
            src={member.photoURL || "/api/placeholder/200/200"} 
            alt="Subject" 
            className="w-full h-full object-cover" 
           />
        </div>

        <div className="text-center">
            <h1 className="text-2xl font-black text-[#002366] uppercase tracking-tighter leading-none mb-1">
                {member.fullName}
            </h1>
            <p className="text-sm font-black text-[#B8860B] uppercase tracking-widest italic">{member.role}</p>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
            <div className="text-center">
                <p className="text-[7px] font-black text-slate-300 uppercase">Jurisdiction</p>
                <p className="text-[9px] font-bold text-[#002366] uppercase">{member.city || 'National'}</p>
            </div>
            <div className="text-center">
                <p className="text-[7px] font-black text-slate-300 uppercase">Registry ID</p>
                <p className="text-[9px] font-bold text-[#002366] uppercase">{member.id?.slice(0, 8).toUpperCase()}</p>
            </div>
        </div>

        {/* Verification QR */}
        <div className="pt-2 flex flex-col items-center">
            <div className="p-2 border-2 border-slate-100 rounded-xl bg-white shadow-inner">
                <QRCodeSVG 
                    value={`https://pdds.ph/verify/${member.id}`} 
                    size={60} 
                    fgColor="#002366"
                />
            </div>
            <p className="text-[6px] font-black text-slate-300 uppercase mt-2 tracking-widest">Scan for Real-Time Vetting</p>
        </div>
      </div>

      {/* Footer Status */}
      <div className="bg-emerald-500 p-3 text-center">
         <p className="text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2">
            <Shield className="h-3 w-3 fill-white" />
            Active Duty Verified
         </p>
      </div>
    </div>
  );
};