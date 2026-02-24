export default function ProfilePage() {
  return (
    <div className="flex flex-col">
      <div className="bg-card p-6 md:p-8 border-b">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your member profile and settings.
          </p>
        </div>
      </div>
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed bg-card">
          <p className="text-muted-foreground">Profile content will be here.</p>
        </div>
      </div>
    </div>
  );
}
