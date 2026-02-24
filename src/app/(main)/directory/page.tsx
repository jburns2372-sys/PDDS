import { DirectoryClient } from "@/components/directory-client";

export default function DirectoryPage() {
  return (
    <div className="flex flex-col">
      <div className="bg-card p-6 md:p-8 border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            Organizational Structure
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse the leadership directory at various levels of the party.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <DirectoryClient />
      </div>
    </div>
  );
}
