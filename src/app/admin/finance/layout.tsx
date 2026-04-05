'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab = pathname.includes('/cashflow') ? 'cashflow' : 'reports';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Keuangan</h1>
        <p className="text-gray-600">Kelola cashflow dan laporan keuangan</p>
      </div>

      <Tabs value={currentTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cashflow" asChild>
            <Link href="/admin/finance/cashflow">Cashflow</Link>
          </TabsTrigger>
          <TabsTrigger value="reports" asChild>
            <Link href="/admin/finance/reports">Laporan Keuangan</Link>
          </TabsTrigger>
        </TabsList>

        <div>{children}</div>
      </Tabs>
    </div>
  );
}
