'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ManagerInventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab = pathname.includes('/products') ? 'products' : 'stock';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
        <p className="text-gray-600">Lihat produk dan kelola stok</p>
      </div>

      <Tabs value={currentTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" asChild>
            <Link href="/manager/inventory/products">Produk</Link>
          </TabsTrigger>
          <TabsTrigger value="stock" asChild>
            <Link href="/manager/inventory/stock">Kelola Stok</Link>
          </TabsTrigger>
        </TabsList>

        <div>{children}</div>
      </Tabs>
    </div>
  );
}
