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
  const currentTab = pathname.includes('/sales') ? 'sales' : 'customers';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Penjualan & Pelanggan</h1>
        <p className="text-gray-600">Proses penjualan dan lihat data pelanggan</p>
      </div>

      <Tabs value={currentTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sales" asChild>
            <Link href="/manager/sales-customers/sales">Penjualan</Link>
          </TabsTrigger>
          <TabsTrigger value="customers" asChild>
            <Link href="/manager/sales-customers/customers">Member</Link>
          </TabsTrigger>
        </TabsList>

        <div>{children}</div>
      </Tabs>
    </div>
  );
}
