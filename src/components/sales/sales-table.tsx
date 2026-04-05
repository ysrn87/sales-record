'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SaleDetailsDialog } from './sale-details-dialog';
import { Pagination } from '@/components/ui/pagination';
import { Eye } from 'lucide-react';

interface SalesTableProps {
  sales: any[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  conversionRate?: number;
}

export function SalesTable({ sales, currentPage, pageSize, totalItems, conversionRate = 1000 }: SalesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', size.toString());
    params.set('page', '1'); // Reset to page 1
    router.push(`?${params.toString()}`);
  };

  const handleViewDetails = (sale: any) => {
    setSelectedSale(sale);
    setShowDetailsDialog(true);
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No sales yet</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale ID #</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Pembayaran</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className='text-xs'>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.saleNumber}</TableCell>
              <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
              <TableCell>{sale.customer?.name || 'Pelanggan-umum'}</TableCell>
              <TableCell>{sale.cashier.name}</TableCell>
              <TableCell>{sale.items.reduce((sum: any, item: any) => sum + item.quantity, 0)} unit</TableCell>
              <TableCell>{formatCurrency(sale.total)}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {sale.paymentMethod}
                </span>
              </TableCell>
              <TableCell>{sale.notes || '-'}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(sale)}
                >
                  <Eye className="w-4 h-4 mr-2" />
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

      {selectedSale && (
        <SaleDetailsDialog
          sale={selectedSale}
          conversionRate={conversionRate}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onUpdate={() => window.location.reload()}
        />
      )}
    </>
  );
}