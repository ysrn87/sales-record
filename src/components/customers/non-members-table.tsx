'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';
import { NonMemberDialog } from './non-member-dialog';
import { UpgradeToMemberDialog } from './upgrade-to-member-dialog';
import { CustomerDeleteButton } from './customer-delete-button';
import { PurchaseHistoryDialog } from './purchase-history-dialog';
import { Pagination } from '@/components/ui/pagination';

interface NonMember {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  createdAt: Date;
  sales: Array<{ id: string; total: number }>;
  _count: { sales: number };
}

interface NonMembersTableProps {
  customers: NonMember[];
  showActions?: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function NonMembersTable({ customers, showActions = false, currentPage, pageSize, totalItems }: NonMembersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [historyCustomer, setHistoryCustomer] = useState<NonMember | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('nm_page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('nm_limit', size.toString());
    params.set('nm_page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleViewHistory = (customer: NonMember) => {
    setHistoryCustomer(customer);
    setHistoryOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Total Pembelian</TableHead>
              <TableHead>Total Belanja</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Tidak ada pelanggan non-member
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const totalSpent = customer.sales.reduce((sum, s) => sum + Number(s.total), 0);
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                    <TableCell title={customer.address || '-'}>
                      <p className="line-clamp-2 max-w-[180px]">{customer.address || '-'}</p>
                    </TableCell>
                    <TableCell>{customer._count.sales}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 items-center">
                        {/* Purchase history — always visible */}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleViewHistory(customer)}
                          title="Riwayat pembelian"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Button>

                        {showActions && (
                          <>
                            <NonMemberDialog
                              mode="edit"
                              customer={{ id: customer.id, name: customer.name, phone: customer.phone, address: customer.address }}
                            />
                            <UpgradeToMemberDialog
                              customer={{ id: customer.id, name: customer.name, phone: customer.phone }}
                            />
                            <CustomerDeleteButton customerId={customer.id} />
                          </>
                        )}
                      </div>
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

      {historyCustomer && (
        <PurchaseHistoryDialog
          customerId={historyCustomer.id}
          customerName={historyCustomer.name}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}
    </>
  );
}
