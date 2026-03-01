
"use client";

import { Gavel, Users, AlertCircle, Library, Ban } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="prose prose-blue max-w-none">
      <h1 className="text-3xl font-black text-primary font-headline uppercase tracking-tight border-b-4 border-primary pb-4 mb-8">
        Terms of Service
      </h1>
      
      <p className="text-sm font-medium text-muted-foreground leading-relaxed italic mb-8">
        Official Code of Conduct and Membership Agreement for the PatriotLink Digital Platform.
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Users className="h-5 w-5 text-accent" />
            1. Eligibility & Membership
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            PatriotLink is the official digital portal for the <strong>Pederalismo ng Dugong Dakilang Samahan (PDDS)</strong>. Use of this application is strictly reserved for individuals who are 18 years of age or older and who formally declare their support for PDDS and the principles of Federalism. 
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <AlertCircle className="h-5 w-5 text-accent" />
            2. Code of Conduct (Town Square)
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            Our Digital Town Square is a space for constructive national mobilization. By participating, you agree to:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-2 mt-2 text-foreground/80">
            <li>Refrain from any form of <strong>harassment, hate speech, or bullying</strong> against fellow members or leadership.</li>
            <li>Strictly avoid the dissemination of <strong>unverified information, 'fake news,' or malicious rumors</strong> that may damage the movement's integrity.</li>
            <li>Prohibit any activities that are illegal under Philippine Law.</li>
          </ul>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Ban className="h-5 w-5 text-destructive" />
            3. Account Termination & Veto Power
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80 italic">
            "Discipline is the foundation of a strong nation."
          </p>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            The Office of the <strong>Secretary General</strong> and the <strong>Presidential Council</strong> reserve the absolute right to suspend or permanently revoke the membership and platform access of any individual who violates these terms or the official party rules. Decisions regarding membership revocation are final and binding within the organizational context.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Library className="h-5 w-5 text-accent" />
            4. Intellectual Property & Tactical Assets
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            All materials found within the <strong>National Tactical Library (Vault)</strong>, including manifestos, posters, and roadmap graphics, are the intellectual property of PDDS. These assets are provided for the sole purpose of <strong>authorized party promotion</strong>. Unauthorized commercial use or alteration of these materials is strictly prohibited.
          </p>
        </div>

        <div className="bg-muted p-6 rounded-xl border-2 border-dashed">
          <h2 className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest">
            <Gavel className="h-4 w-4" />
            Legal Acceptance
          </h2>
          <p className="text-xs leading-relaxed mt-2 text-muted-foreground">
            By proceeding with your induction into PatriotLink, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and the official PDDS Governance Framework.
          </p>
        </div>
      </section>
    </div>
  );
}
