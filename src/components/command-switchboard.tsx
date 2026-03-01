
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
  MessageSquare
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview Role-Based Tactical Switchboard.
 * Displays unique quick actions for each high-level role in the PDDS hierarchy.
 */
export function CommandSwitchboard() {
  const { userData } = useUserData();
  const role = userData?.role || 'Member';

  const getRoleActions = () => {
    switch (role) {
      case 'President':
        return [
          { label: 'Heat Map', icon: Map, href: '/admin/analytics', color: 'text-accent' },
          { label: 'Broadcast', icon: Megaphone, href: '/admin/broadcast', color: 'text-red-600' },
          { label: 'Audit Queue', icon: Shield, href: '/admin/audit', color: 'text-primary' }
        ];
      case 'VP':
        return [
          { label: 'Calendar', icon: Calendar, href: '/calendar', color: 'text-primary' },
          { label: 'Briefings', icon: BookText, href: '/agendas', color: 'text-primary' },
          { label: 'Media Feed', icon: Newspaper, href: '/admin/bulletin', color: 'text-primary' }
        ];
      case 'Secretary General':
      case 'Sec Gen':
        return [
          { label: 'Registry', icon: Users, href: '/admin/dashboard', color: 'text-primary' },
          { label: 'Vetting', icon: UserCheck, href: '/admin/supporters', color: 'text-emerald-600' },
          { label: 'Audit Log', icon: Shield, href: '/admin/audit', color: 'text-primary' }
        ];
      case 'Public Relations Officer':
      case 'PRO':
        return [
          { label: 'Bulletin', icon: Newspaper, href: '/admin/bulletin', color: 'text-red-600' },
          { label: 'Broadcast', icon: Megaphone, href: '/admin/broadcast', color: 'text-red-600' },
          { label: 'Poll Manager', icon: LayoutGrid, href: '/admin/bulletin?tab=polls', color: 'text-primary' }
        ];
      case 'Treasurer':
        return [
          { label: 'Logistics', icon: LayoutGrid, href: '/admin/logistics', color: 'text-emerald-600' },
          { label: 'Resources', icon: Shield, href: '/admin/analytics', color: 'text-primary' }
        ];
      case 'Coordinator':
        return [
          { label: 'Scanner', icon: QrCode, href: '/admin/scanner', color: 'text-primary' },
          { label: 'Chapter Map', icon: Map, href: '/home?tab=mobilize', color: 'text-accent' },
          { label: 'Supporter List', icon: Search, href: '/admin/supporters', color: 'text-primary' }
        ];
      default:
        return null;
    }
  };

  const actions = getRoleActions();

  if (!actions) return null;

  return (
    <Card className="shadow-2xl border-t-4 border-primary bg-white overflow-hidden mb-8">
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
            <Button 
              key={action.label} 
              asChild 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-2 border-primary/10 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <Link href={action.href}>
                <action.icon className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] font-black uppercase tracking-tighter text-primary">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
