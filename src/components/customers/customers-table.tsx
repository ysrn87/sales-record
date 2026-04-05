'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Eye, Award } from 'lucide-react';
import { CustomerDetailsDialog } from './customer-details-dialog';
import { CustomerDialog } from './customer-dialog';
import { CustomerDeleteButton } from './customer-delete-button';
import { PointsHistoryDialog } from './points-history-dialog';
import { Pagination } from '@/components/ui/pagination';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  birthday?: Date | null;
  address?: string | null;
  photoUrl?: string | null;
  points: number;
  createdAt: Date;
  sales: Array<{
    id: string;
    total: any;
  }>;
  _count: {
    sales: number;
  };
}

interface CustomersTableProps {
  customers: Customer[];
  showActions?: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function CustomersTable({ 
  customers, 
  showActions = false,
  currentPage,
  pageSize,
  totalItems
}: CustomersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pointsHistoryCustomer, setPointsHistoryCustomer] = useState<Customer | null>(null);
  const [pointsHistoryOpen, setPointsHistoryOpen] = useState(false);

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

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const handleViewPoints = (customer: Customer) => {
    setPointsHistoryCustomer(customer);
    setPointsHistoryOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="text-center">
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Telpon/WA</TableHead>
              <TableHead>Tanggal Lahir</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Poin</TableHead>
              <TableHead>Total Pembelian</TableHead>
              <TableHead>Total Belanja</TableHead>
              <TableHead>Member Since</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='text-xs'>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Tidak ditemukan pelanggan
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);

                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <p className='line-clamp-2 min-w-32'>
                        {customer.name}
                      </p>  
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <p className='line-clamp-2 min-w-32'>
                        {customer.birthday 
                        ? new Date(customer.birthday).toLocaleDateString('id-ID', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          }) 
                        : '-'}
                      </p>                      
                    </TableCell>
                    <TableCell title={customer.address || '-'}>
                      <p className='line-clamp-2 min-w-60'>
                        {customer.address || '-'}
                      </p>  
                    </TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewPoints(customer)}
                        className="flex items-center gap-1 hover:text-yellow-700 transition-colors cursor-pointer group"
                        title="Lihat riwayat poin"
                      >
                        <Award className="h-4 w-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold underline decoration-dotted underline-offset-2">
                          {customer.points}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>{customer._count.sales}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {showActions ? (
                        // Admin view with Edit & Delete
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <CustomerDialog
                            mode="edit"
                            customer={{
                              id: customer.id,
                              name: customer.name,
                              phone: customer.phone,
                              address: customer.address ?? undefined,
                              email: customer.email ?? undefined,
                              birthday: customer.birthday ?? undefined,
                              photoUrl: customer.photoUrl ?? undefined,
                              points: customer.points,
                            }}
                          />
                          <CustomerDeleteButton customerId={customer.id} />
                        </div>
                      ) : (
                        // Manager view (view only)
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                      )}
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

      {selectedCustomer && (
        <CustomerDetailsDialog
          customer={selectedCustomer}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {pointsHistoryCustomer && (
        <PointsHistoryDialog
          customerId={pointsHistoryCustomer.id}
          customerName={pointsHistoryCustomer.name}
          currentPoints={pointsHistoryCustomer.points}
          open={pointsHistoryOpen}
          onOpenChange={setPointsHistoryOpen}
        />
      )}
    </>
  );
}