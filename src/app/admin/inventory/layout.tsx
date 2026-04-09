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
    <div>
      {/* Page title — desktop only */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
        <p className="text-gray-600">Kelola produk, stok, dan laporan inventori</p>
      </div>

      <Tabs value={currentTab}>
        {/* Sticky tab bar */}
        <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6 py-3 border-b border-gray-200 shadow-sm">
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
        </div>

        <div className="pt-6">{children}</div>
      </Tabs>
    </div>
  );
}