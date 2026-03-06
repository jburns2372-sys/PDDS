"use client";

import { Gavel, Users, AlertCircle, Wallet, Ban, ShieldAlert } from "lucide-react";

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
            1. Eligibility
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            Use of PatriotLink is strictly restricted to verified supporters and members of the <strong>PDDS (Pederalismo ng Dugong Dakilang Samahan)</strong>. Users must be at least 18 years of age and must formally declare their alignment with the party's principles.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <ShieldAlert className="h-5 w-5 text-accent" />
            2. Prohibited Conduct
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            To maintain organizational integrity and security, users are strictly forbidden from:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-3 mt-2 text-foreground/80 font-medium">
            <li>
              <strong>Intellectual Sabotage:</strong> Sharing internal PatriotHub discussions, tactical documents, or strategy briefings with outside parties or media without explicit approval from the <strong>Office of the PRO</strong>.
            </li>
            <li>
              <strong>Malicious Content:</strong> Posting or disseminating "Fake News," harassment, bullying, or hate speech against fellow members or the leadership.
            </li>
            <li>
              <strong>Digital Intrusion:</strong> Attempting to "infiltrate," reverse-engineer, or disrupt the app’s digital infrastructure, including unauthorized access to the National Vault.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Ban className="h-5 w-5 text-destructive" />
            3. Termination
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            The <strong>Secretary General</strong> reserves the absolute right to revoke access, suspend privileges, and permanently delete the account of any user who violates these terms, breaches security protocols, or works against the strategic interests of the party. Decisions made by the Sec-Gen are final.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary uppercase font-headline">
            <Wallet className="h-5 w-5 text-accent" />
            4. Financial Contributions
          </h2>
          <p className="text-sm leading-relaxed mt-2 text-foreground/80">
            All donations made via <strong>PatriotPondo</strong> are voluntary contributions to the national movement. By confirming a contribution, you acknowledge that all funds are <strong>non-refundable</strong> and will be utilized for authorized party expenditures as logged in the public transparency ledger.
          </p>
        </div>

        <div className="bg-muted p-6 rounded-xl border-2 border-dashed">
          <h2 className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest">
            <Gavel className="h-4 w-4" />
            Legal Acceptance
          </h2>
          <p className="text-xs leading-relaxed mt-2 text-muted-foreground">
            By proceeding with your induction into PatriotLink, you acknowledge that you have read, understood, and agreed to be bound by these specific Terms of Service and the official PDDS Governance Framework.
          </p>
        </div>
      </section>
    </div>
  );
}
