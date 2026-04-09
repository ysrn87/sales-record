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
    <div>
      {/* Page title — desktop only */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
        <p className="text-gray-600">Lihat produk dan kelola stok</p>
      </div>

      <Tabs value={currentTab}>
        {/* Sticky tab bar */}
        <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6 py-3 border-b border-gray-200 shadow-sm">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" asChild>
              <Link href="/manager/inventory/products">Produk</Link>
            </TabsTrigger>
            <TabsTrigger value="stock" asChild>
              <Link href="/manager/inventory/stock">Kelola Stok</Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-6">{children}</div>
      </Tabs>
    </div>
  );
}