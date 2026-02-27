
"use client";

import { RoleGate } from "@/components/role-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </RoleGate>
  );
}
