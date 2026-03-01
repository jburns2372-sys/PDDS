
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Gavel, Eye, Edit3, UserCheck, Smartphone, Users, Package, Megaphone } from "lucide-react";

/**
 * @fileOverview Command & Membership Manual.
 * Defines the official roles, digital functions, and data permissions for the PDDS hierarchy.
 */
export default function GovernanceManualPage() {
  return (
    <div className="p-4 md:p-8 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col border-b-4 border-primary pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
              <Gavel className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tight">Command & Membership Manual</h1>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Official Governance Framework v2.1 - PDDS National HQ</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-amber-800 leading-snug">
              CONFIDENTIAL: This digital manual defines the operational hierarchy and data privacy boundaries of the PatriotLink platform. Unauthorized reproduction is strictly prohibited.
            </p>
          </div>
        </div>

        {/* Governance Framework Table */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-accent" />
            I. Organizational Governance Framework
          </h2>
          <Card className="shadow-2xl overflow-hidden border-none bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary text-white hover:bg-primary">
                    <TableHead className="text-white font-black uppercase text-[10px] py-6 pl-6">Rank / Role</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px] py-6">Core Responsibility</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px] py-6">Digital Interface</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px] py-6">Input Permissions</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px] py-6 pr-6">Privacy Boundary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* President */}
                  <TableRow className="hover:bg-muted/30 border-b-2">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">President</TableCell>
                    <TableCell className="text-xs font-medium">National Strategy & Veto Authority</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Executive Heat Map</TableCell>
                    <TableCell className="text-xs">Full Global Write Access</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">ZERO - Full Visibility</TableCell>
                  </TableRow>
                  {/* Chairman / Vice Chairman */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Chairman & VC</TableCell>
                    <TableCell className="text-xs font-medium">Oversight & Party Ideology</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">National Command Center</TableCell>
                    <TableCell className="text-xs">Strategy Notes, Vetting Approval</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Full Visibility (Audit-Only)</TableCell>
                  </TableRow>
                  {/* Vice President */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Vice President</TableCell>
                    <TableCell className="text-xs font-medium">Operational Command & Deployment</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Tactical Dashboard</TableCell>
                    <TableCell className="text-xs">Event Authorization, Resource Dispatch</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Full Visibility</TableCell>
                  </TableRow>
                  {/* Sec Gen */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Sec General</TableCell>
                    <TableCell className="text-xs font-medium">The Gatekeeper & Registry Admin</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Audit Queue / Registry</TableCell>
                    <TableCell className="text-xs">Vetting Tiers, ID Approval</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Forbidden: Private Resource Logs</TableCell>
                  </TableRow>
                  {/* PRO */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Public Relations</TableCell>
                    <TableCell className="text-xs font-medium">The Voice & National Media Head</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Broadcast / Bulletin</TableCell>
                    <TableCell className="text-xs">National Announcements, Polls</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Forbidden: Member ID Scans</TableCell>
                  </TableRow>
                  {/* Treasurer */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Treasurer</TableCell>
                    <TableCell className="text-xs font-medium">Resource Management & Logistics</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Logistics Tracker</TableCell>
                    <TableCell className="text-xs">Inventory & Shipment Logs</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Forbidden: Personal Vetting Files</TableCell>
                  </TableRow>
                  {/* Auditor */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Auditor</TableCell>
                    <TableCell className="text-xs font-medium">Compliance & Integrity Review</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">National Audit Log</TableCell>
                    <TableCell className="text-xs">Compliance Reports, Entry Scans</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Full Transparency Access</TableCell>
                  </TableRow>
                  {/* Specialized VPs */}
                  <TableRow className="hover:bg-muted/30 border-b-2">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Specialized VPs</TableCell>
                    <TableCell className="text-xs font-medium">Pillar Lead (Legal, Membership, etc.)</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Sector Vault / Briefing</TableCell>
                    <TableCell className="text-xs">Sector Directives, Tactical Assets</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Boundary: Sector Jurisdiction</TableCell>
                  </TableRow>
                  {/* Coordinator */}
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Coordinator</TableCell>
                    <TableCell className="text-xs font-medium">Regional Field Commander</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Supporter List / Map</TableCell>
                    <TableCell className="text-xs">Regional Event Pins, Vetting Notes</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Boundary: Assigned Region Only</TableCell>
                  </TableRow>
                  {/* Member */}
                  <TableRow className="hover:bg-muted/30 bg-muted/5">
                    <TableCell className="pl-6 font-black text-primary text-sm uppercase">Member</TableCell>
                    <TableCell className="text-xs font-medium">The Grassroots Base</TableCell>
                    <TableCell className="text-xs font-bold text-accent uppercase">Digital ID / Pulse</TableCell>
                    <TableCell className="text-xs">Personal Profile, Feedback</TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">Boundary: Self-Service Data Only</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

        {/* Digital Access Policy */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
              <Lock className="h-6 w-6 text-accent" />
              II. Digital Access Policy
            </h2>
            <Card className="shadow-lg border-l-4 border-l-primary bg-white h-full">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-3">
                  <Eye className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase text-primary">Need-to-Know Principle</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Data visibility is restricted by jurisdictional tags. A Regional Coordinator cannot view member data for a different region to prevent unauthorized data mining.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Edit3 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase text-primary">Audit Persistence</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Every administrative change (promotion, vetting, broadcast, logistics entry) is logged with a timestamp and user ID for forensic review by the Auditor.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <UserCheck className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase text-primary">ID Encryption</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Government ID scans are stored in a private vault with end-to-end encryption, accessible only via Sec-Gen or President clearance.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-accent" />
              III. Member Engagement Suite
            </h2>
            <Card className="shadow-lg border-l-4 border-l-accent bg-white h-full">
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 border-b border-dashed pb-3 last:border-0">
                    <Badge className="bg-primary h-6 w-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                    <span className="text-xs font-bold uppercase text-primary">Attend Rallies via Digital ID Scan</span>
                  </li>
                  <li className="flex items-center gap-3 border-b border-dashed pb-3 last:border-0">
                    <Badge className="bg-primary h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                    <span className="text-xs font-bold uppercase text-primary">Access Authorized Tactical Assets (Vault)</span>
                  </li>
                  <li className="flex items-center gap-3 border-b border-dashed pb-3 last:border-0">
                    <Badge className="bg-primary h-6 w-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                    <span className="text-xs font-bold uppercase text-primary">Recruit New Supporters (Referral Power)</span>
                  </li>
                  <li className="flex items-center gap-3 border-b border-dashed pb-3 last:border-0">
                    <Badge className="bg-primary h-6 w-6 rounded-full p-0 flex items-center justify-center">4</Badge>
                    <span className="text-xs font-bold uppercase text-primary">Sync with Local Chapter (Coordinator)</span>
                  </li>
                  <li className="flex items-center gap-3 border-b border-dashed pb-3 last:border-0">
                    <Badge className="bg-primary h-6 w-6 rounded-full p-0 flex items-center justify-center">5</Badge>
                    <span className="text-xs font-bold uppercase text-primary">Submit Community Sentiment Feedback</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer Audit Label */}
        <div className="pt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-muted px-6 py-2 rounded-full border">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Framework Active: Authorized by the National Board</span>
          </div>
        </div>

      </div>
    </div>
  );
}
