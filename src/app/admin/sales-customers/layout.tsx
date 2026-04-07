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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Penjualan & Pelanggan</h1>
        <p className="text-gray-600">
          Kelola transaksi penjualan dan data pelanggan
        </p>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(value) =>
          router.push(`/admin/sales-customers/${value}`)
        }
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="customers">Customer</TabsTrigger>
        </TabsList>

        <div>{children}</div>
      </Tabs>
    </div>
  );
}
