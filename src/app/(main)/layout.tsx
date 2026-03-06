import { AppShell } from '@/components/app-shell';
import PatriotLayout from '@/components/patriot-layout';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PatriotLayout>
      <AppShell>{children}</AppShell>
    </PatriotLayout>
  );
}
