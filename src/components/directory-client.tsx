"use client";

import { useCollection } from '@/firebase';
import { OfficerCard } from './officer-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pddsLeadershipRoles } from '@/lib/data';
import { Loader2 } from 'lucide-react';

const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export function DirectoryClient() {
  const { data: users, loading } = useCollection('users');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading organizational structure...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="National" className="w-full">
      <div className="overflow-x-auto pb-2">
        <TabsList className="bg-primary/10">
          {levels.map(level => (
            <TabsTrigger 
              key={level} 
              value={level} 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {levels.map(level => (
        <TabsContent key={level} value={level}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pddsLeadershipRoles.map((role) => {
                    // Find the officer for this specific role and level
                    const officer = (users || []).find(u => 
                        u.role === role && u.level === level
                    );
                    
                    return (
                        <OfficerCard 
                            key={role} 
                            role={role} 
                            name={officer?.fullName || ""} 
                            avatarUrl={officer?.avatarUrl || ""}
                        />
                    );
                })}
            </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
