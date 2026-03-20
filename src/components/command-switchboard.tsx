"use client";

import { useUserData } from "@/context/user-data-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Map, 
  Megaphone, 
  Calendar, 
  BookText, 
  UserCheck, 
  LayoutGrid, 
  QrCode, 
  Newspaper,
  Users,
  Search,
  MessageSquare,
  HeartHandshake,
  Eye,
  Landmark,
  Wallet,
  Hexagon
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview Role-Based Tactical Switchboard.
 * ACTIVATED: Enhanced clickability and visual feedback for leadership actions.
 */
export function CommandSwitchboard() {
  const { userData } = useUserData();
  const role = userData?.role || 'Member';
  const isGold = userData?.vettingLevel === 'Gold';

  const getRoleActions = () => {
    const baseActions = [
      { label: 'PatriotHub', icon: Hexagon, href: '/chat', color: 'text-primary' }
    ];
    
    if (role === 'Coordinator' || isGold || role === 'President' || role === 'Admin') {
      baseActions.push({ label: 'Bayanihan', icon: HeartHandshake, href: '/bayanihan', color: 'text-red-600' });
    } else {
      baseActions.push({ label: 'Bantay Bayan', icon: Eye, href: '/bantay-bayan', color: 'text-red-700' });
    }

    switch (role) {
      case 'President':
        return [
          ...baseActions,
          { label: 'Broadcast', icon: Megaphone, href: '/admin/broadcast', color: 'text-red-600' }
        ].slice(0, 3);
      case 'Treasurer':
        return [
          ...baseActions,
          { label: 'Vault Command', icon: Wallet, href: '/admin/pondo', color: 'text-red-700' },
          { label: 'Logistics', icon: LayoutGrid, href: '/admin/logistics', color: 'text-emerald-600' }
        ].slice(0, 3);
      case 'Secretary General':
      case 'Sec Gen':
        return [
          ...baseActions,
          { label: 'Registry', icon: Users, href: '/admin/dashboard', color: 'text-primary' },
          { label: 'Vetting', icon: UserCheck, href: '/admin/supporters', color: 'text-emerald-600' }
        ].slice(0, 3);
      case 'Public Relations Officer':
      case 'PRO':
        return [
          ...baseActions,
          { label: 'Bulletin', icon: Newspaper, href: '/admin/bulletin', color: 'text-red-600' },
          { label: 'Broadcast', icon: Megaphone, href: '/admin/broadcast', color: 'text-red-600' }
        ].slice(0, 3);
      case 'Coordinator':
        return [
          ...baseActions,
          { label: 'Scanner', icon: QrCode, href: '/admin/scanner', color: 'text-primary' }
        ].slice(0, 3);
      default:
        return [
          ...baseActions,
          { label: 'Vault', icon: BookText, href: '/vault', color: 'text-primary' }
        ].slice(0, 3);
    }
  };

  const actions = getRoleActions();

  return (
    <Card className="shadow-2xl border-t-4 border-primary bg-white overflow-hidden mb-8 relative z-10">
      <CardHeader className="bg-primary/5 pb-4 border-b">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          {role} Command Widget
        </CardTitle>
        <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Quick-access tactical terminals for your rank.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link key={action.label} href={action.href} className="block group outline-none">
              <Button 
                variant="outline" 
                className="w-full h-24 flex flex-col gap-2 border-2 border-primary/10 hover:border-primary hover:bg-primary/5 transition-all duration-300 active:scale-95 shadow-sm group-hover:shadow-md"
              >
                <action.icon className={`h-7 w-7 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] font-black uppercase tracking-tighter text-primary group-hover:text-accent transition-colors">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
