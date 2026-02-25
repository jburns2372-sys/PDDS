import { AccessManagementClient } from "@/components/access-management-client";
import { ShieldCheck } from "lucide-react";

export default function SuperAdminPage() {
  return (
    <div className="flex flex-col">
      <div className="bg-card p-6 md:p-8 border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Access & Role Management (Superadmin)
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage user roles, jurisdictions, and access levels across the organization.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AccessManagementClient />
      </div>
    </div>
  );
}
