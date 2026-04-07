'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Award } from 'lucide-react';
import { CustomerDetailsDialog } from './customer-details-dialog';
import { PointsHistoryDialog } from './points-history-dialog';
import { Pagination } from '@/components/ui/pagination';

interface MemberCustomer {
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
  type: 'member';
}

interface NonMemberCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  sales: Array<{
    id: string;
    total: any;
  }>;
  _count: {
    sales: number;
  };
  type: 'non-member';
}

type Customer = MemberCustomer | NonMemberCustomer;

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
  const [pointsHistoryCustomer, setPointsHistoryCustomer] = useState<MemberCustomer | null>(null);
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

  const handleViewPoints = (customer: MemberCustomer) => {
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
              <TableHead>Type</TableHead>
              <TableHead>Telpon/WA</TableHead>
              <TableHead>Tanggal Lahir</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Poin</TableHead>
              <TableHead>Total Pembelian</TableHead>
              <TableHead>Total Belanja</TableHead>
              <TableHead>Terdaftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='text-xs'>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  Tidak ditemukan pelanggan
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
                const isMember = customer.type === 'member';

                return (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => handleViewDetails(customer)}
                  >
                    <TableCell className="font-medium">
                      <p className='truncate'>
                        {customer.name}
                      </p>  
                    </TableCell>
                    <TableCell className='truncate'>
                      {isMember ? (
                        <Badge variant="default" className="bg-blue-600">Member</Badge>
                      ) : (
                        <Badge variant="secondary">Non-Member</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <p className='line-clamp-2 min-w-32'>
                        {isMember && customer.birthday 
                        ? new Date(customer.birthday).toLocaleDateString('id-ID', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          }) 
                        : '-'}
                      </p>                      
                    </TableCell>
                    <TableCell title={customer.address || '-'}>
                      <p className='line-clamp-20'>
                        {customer.address || '-'}
                      </p>  
                    </TableCell>
                    <TableCell>{isMember && customer.email ? customer.email : '-'}</TableCell>
                    <TableCell>
                      {isMember ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewPoints(customer as MemberCustomer); }}
                          className="flex items-center gap-1 hover:text-yellow-700 transition-colors cursor-pointer group"
                          title="Lihat riwayat poin"
                        >
                          <Award className="h-4 w-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold underline decoration-dotted underline-offset-2">
                            {customer.points}
                          </span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{customer._count.sales}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
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
          showActions={showActions}
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