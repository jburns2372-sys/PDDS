
"use client";

import { useCollection } from '@/firebase';
import { OfficerCard } from './officer-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pddsLeadershipRoles, jurisdictionLevels } from '@/lib/data';
import { Loader2, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export function DirectoryClient() {
  const { data: users, loading } = useCollection('users');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing Structure...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="National" className="w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <TabsList className="bg-primary/5 p-1 border border-primary/10">
          {jurisdictionLevels.map(level => (
            <TabsTrigger 
              key={level} 
              value={level} 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold px-6"
            >
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="text-sm font-medium text-muted-foreground bg-white px-4 py-2 rounded-full border shadow-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Registry Count: {users?.length || 0}
        </div>
      </div>

      {jurisdictionLevels.map(level => (
        <TabsContent key={level} value={level} className="mt-0 focus-visible:outline-none">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl font-headline text-primary/80 flex items-center gap-2">
                        {level} Leadership Core
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pddsLeadershipRoles.map((role) => {
                            const officer = (users || []).find(u => 
                                u.role === role && u.jurisdictionLevel === level
                            );
                            
                            return (
                                <OfficerCard 
                                    key={`${level}-${role}`} 
                                    role={role} 
                                    name={officer?.fullName || ""} 
                                    photoURL={officer?.photoURL || ""}
                                />
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
