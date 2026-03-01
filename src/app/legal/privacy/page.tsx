
"use client";

import { ShieldCheck, Lock, Eye, Trash2, UserCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-blue max-w-none">
      <h1 className="text-3xl font-black text-primary font-headline uppercase tracking-tight border-b-4 border-primary pb-4 mb-8">
        Privacy Policy
      </h1>
      
      <p className="text-sm font-medium text-muted-foreground leading-relaxed italic mb-8">
        Last Updated: October 2025. This policy is established in accordance with Republic Act No. 10173, also known as the Data Privacy Act of 2012 (DPA).
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <UserCheck className="h-5 w-5 text-accent" />
            1. Data Collection & Vetting
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            PatriotLink collects personal information necessary for membership management and organizational security. This includes your full name, contact details, and jurisdictional location. 
            <strong> Specifically for Officer Vetting and Membership Authentication:</strong> We require the submission of government-issued identification cards. These IDs are used exclusively to verify your identity and ensure the integrity of the PDDS leadership hierarchy.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <ShieldCheck className="h-5 w-5 text-accent" />
            2. Purpose of Processing
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            Your data is processed for the following organizational purposes:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-2 text-foreground/80">
            <li><strong>Political Mobilization:</strong> Coordinating rallies, assemblies, and local gatherings.</li>
            <li><strong>Party Communication:</strong> Sending official directives, SMS alerts, and internal updates.</li>
            <li><strong>Internal Security:</strong> Preventing unauthorized access to sensitive tactical assets and verifying the "Patriot" status of our members.</li>
          </ul>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Lock className="h-5 w-5 text-accent" />
            3. Storage & Data Protection
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            PatriotLink utilizes high-security, encrypted Firebase servers for all data storage. Access to sensitive records, including government ID scans, is strictly restricted to the <strong>Office of the Secretary General</strong> and the <strong>Presidential Council</strong>. We implement industry-standard encryption protocols to protect your information from unauthorized disclosure or breach.
          </p>
        </div>

        <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Eye className="h-5 w-5 text-primary" />
            4. Your Rights as a Data Subject
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-primary tracking-widest">Right to be Informed</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">You have the right to know how your data is being used and for what specific organizational purpose.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-primary tracking-widest">Right to Object</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">You may object to the processing of your data for mobilization purposes at any time, though this may limit your access to party features.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-primary tracking-widest text-destructive">Right to Erasure</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">You may request the permanent deletion of your account and all associated personal data from the National Registry.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            For privacy concerns, contact the National Privacy Officer at privacy@pdds-party.org
          </p>
        </div>
      </section>
    </div>
  );
}
