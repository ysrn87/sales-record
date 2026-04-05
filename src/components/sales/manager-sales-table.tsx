'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';
import { Eye } from 'lucide-react';

interface ManagerSalesTableProps {
  sales: Array<{
    id: string;
    saleNumber: string;
    createdAt: Date;
    customer: { name: string } | null;
    items: Array<{ quantity: number }>;
    total: number;
    paymentMethod: string;
  }>;
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function ManagerSalesTable({ 
  sales, 
  currentPage, 
  pageSize, 
  totalItems 
}: ManagerSalesTableProps) {
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

  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Belum ada penjualan</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale #</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className='text-xs'>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.saleNumber}</TableCell>
              <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
              <TableCell>{sale.customer?.name || 'pelanggan umum'}</TableCell>
              <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} unit</TableCell>
              <TableCell>{formatCurrency(sale.total)}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {sale.paymentMethod}
                </span>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" title="View details">
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
