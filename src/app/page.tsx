import { redirect } from 'next/navigation';

export default function RootPage() {
  // This page just redirects to the home page.
  // The auth guard in the AppShell will handle redirecting to /login if needed.
  redirect('/home');
}
