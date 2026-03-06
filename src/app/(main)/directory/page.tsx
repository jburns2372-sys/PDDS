import { DirectoryClient } from "@/components/directory-client";

/**
 * @fileOverview Organizational Structure Directory.
 * REFACTORED: Fluid full-width architecture.
 */
export default function DirectoryPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="bg-card p-6 md:p-8 lg:px-10 border-b">
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
            Organizational Structure
          </h1>
          <p className="mt-2 text-muted-foreground font-medium">
            Browse the leadership directory at various levels of the party.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-8 lg:p-10 w-full">
        <DirectoryClient />
      </div>
    </div>
  );
}