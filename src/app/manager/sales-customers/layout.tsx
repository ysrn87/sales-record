'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ManagerSalesCustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab = pathname.includes('/recap')
    ? 'recap'
    : pathname.includes('/customers')
    ? 'customers'
    : 'sales';

  return (
    <div>
      {/* Page title — desktop only */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold">Penjualan & Pelanggan</h1>
        <p className="text-gray-600">Proses penjualan dan lihat data pelanggan</p>
      </div>

      <Tabs value={currentTab}>
        {/* Sticky tab bar */}
        <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6 py-3 border-b border-gray-200 shadow-sm">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="sales" asChild>
              <Link href="/manager/sales-customers/sales">Penjualan</Link>
            </TabsTrigger>
            <TabsTrigger value="customers" asChild>
              <Link href="/manager/sales-customers/customers">Customer</Link>
            </TabsTrigger>
            <TabsTrigger value="recap" asChild>
              <Link href="/manager/sales-customers/recap">Rekap</Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-6">{children}</div>
      </Tabs>
    </div>
  );
}