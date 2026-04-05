import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Redirect to appropriate dashboard based on role
  switch (session.user.role) {
    case 'ADMINISTRATOR':
      redirect('/admin');
    case 'MANAGER':
      redirect('/manager');
    case 'MEMBER':
      redirect('/member');
    default:
      redirect('/login');
  }
}
