import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  if (session.user.role !== 'ADMINISTRATOR') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation role={session.user.role} userName={session.user.name}/>
      <main className="container mx-auto p-8 pb-28 lg:pb-8">
        {children}
      </main>
    </div>
  );
}