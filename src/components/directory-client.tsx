"use client";

import { OfficerCard } from './officer-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { officerRoles } from '@/lib/data';

const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export function DirectoryClient() {
  return (
    <Tabs defaultValue="National" className="w-full">
      <div className="overflow-x-auto pb-2">
        <TabsList className="bg-primary/10">
          {levels.map(level => (
            <TabsTrigger key={level} value={level} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {level}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {levels.map(level => (
        <TabsContent key={level} value={level}>
            {/* For this prototype, the same list is shown for all levels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {officerRoles.map((officer) => (
                    <OfficerCard 
                        key={officer.id} 
                        role={officer.role} 
                        name={officer.name} 
                        avatarId={officer.avatarId}
                    />
                ))}
            </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
