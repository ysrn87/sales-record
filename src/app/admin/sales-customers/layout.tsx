'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SalesCustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = pathname.split('/').pop();

  return (
    <div>
      {/* Page title — desktop only */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold">Penjualan & Pelanggan</h1>
        <p className="text-gray-600">Kelola transaksi penjualan dan data pelanggan</p>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(value) => router.push(`/admin/sales-customers/${value}`)}
      >
        {/* Sticky tab bar */}
        <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6 py-3 border-b border-gray-200 shadow-sm">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="customers">Customer</TabsTrigger>
            <TabsTrigger value="recap">Rekap</TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-6">{children}</div>
      </Tabs>
    </div>
  );
}