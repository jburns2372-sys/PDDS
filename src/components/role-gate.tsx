
"use client";

import { useUserData } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { pddsLeadershipRoles } from "@/lib/data";

interface RoleGateProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function RoleGate({ children, allowedRoles = [] }: RoleGateProps) {
  const { userData, loading } = useUserData();
  const router = useRouter();
  const { toast } = useToast();

  const userRole = userData?.role || '';
  
  // Authorized if user is in the leadership roles list or is an Officer/Admin/System Admin
  const isOfficer = pddsLeadershipRoles.includes(userRole) || userRole === 'Officer';
  const isAdmin = userRole === 'Admin' || userRole === 'System Admin';

  const isAuthorized = isOfficer || isAdmin;

  // If specific roles are provided, check against them
  const hasSpecificRole = allowedRoles.length > 0 ? allowedRoles.includes(userRole) : true;

  useEffect(() => {
    if (!loading && (!isAuthorized || !hasSpecificRole)) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have the required role to access this section.",
      });
      router.push('/home');
    }
  }, [isAuthorized, hasSpecificRole, loading, router, toast]);

  if (loading) {
    return null; // Or a loading skeleton
  }

  if (!isAuthorized || !hasSpecificRole) {
    return null;
  }

  return <>{children}</>;
}
