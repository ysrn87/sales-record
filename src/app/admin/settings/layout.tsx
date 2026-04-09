'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab = pathname.includes('/points') ? 'points' : 'profile';

  return (
    <div>
      {/* Page title — desktop only */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-gray-600">Kelola sistem poin dan profil admin</p>
      </div>

      <Tabs value={currentTab}>
        {/* Sticky tab bar */}
        <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6 py-3 border-b border-gray-200 shadow-sm">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="points" asChild>
              <Link href="/admin/settings/points">Sistem Poin</Link>
            </TabsTrigger>
            <TabsTrigger value="profile" asChild>
              <Link href="/admin/settings/profile">Profil Admin</Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-6">{children}</div>
      </Tabs>
    </div>
  );
}