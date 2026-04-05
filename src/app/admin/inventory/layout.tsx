'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab = pathname.includes('/products') 
    ? 'products' 
    : pathname.includes('/stock') 
    ? 'stock' 
    : 'reports';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
        <p className="text-gray-600">Kelola produk, stok, dan laporan inventori</p>
      </div>

      <Tabs value={currentTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="products" asChild>
            <Link href="/admin/inventory/products">Produk</Link>
          </TabsTrigger>
          <TabsTrigger value="stock" asChild>
            <Link href="/admin/inventory/stock">Stok</Link>
          </TabsTrigger>
          <TabsTrigger value="reports" asChild>
            <Link href="/admin/inventory/reports">Laporan</Link>
          </TabsTrigger>
        </TabsList>

        <div>{children}</div>
      </Tabs>
    </div>
  );
}
