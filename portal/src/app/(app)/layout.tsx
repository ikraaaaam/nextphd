import { logout } from '../login/actions';
import { requireSession } from '@/lib/session';
import AppShell from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  return (
    <AppShell email={user.email ?? 'Signed in'} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
