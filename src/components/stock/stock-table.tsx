'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { Pagination } from '@/components/ui/pagination';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStock: number;
  product: {
    name: string;
  };
}

interface StockTableProps {
  stockItems: StockItem[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function StockTable({ 
  stockItems, 
  currentPage, 
  pageSize, 
  totalItems 
}: StockTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', size.toString());
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Varian Produk</TableHead>
              <TableHead>Stok Tersedia</TableHead>
              <TableHead>Stok Min</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='text-xs'>
            {stockItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Tidak ada produk tersedia
                </TableCell>
              </TableRow>
            ) : (
              stockItems.map((item) => {
                const isLowStock = item.stock <= item.lowStock;
                return (
                  <TableRow key={item.id}>
                    <TableCell className='font-mono'>{item.sku}</TableCell>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <span className={isLowStock ? 'text-red-600 font-bold' : ''}>
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell>{item.lowStock}</TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Stok menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Tersedia
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StockAdjustmentDialog 
                        variantId={item.id} 
                        variantName={`${item.product.name} - ${item.name}`} 
                        currentStock={item.stock} 
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </>
  );
}
