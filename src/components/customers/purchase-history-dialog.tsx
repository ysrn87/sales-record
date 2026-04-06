'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { getCustomerPurchaseHistory } from '@/actions/members';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

interface PurchaseHistoryDialogProps {
  customerId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 5;

export function PurchaseHistoryDialog({ customerId, customerName, open, onOpenChange }: PurchaseHistoryDialogProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ sales: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await getCustomerPurchaseHistory(customerId, p, PAGE_SIZE);
      setData(result);
    } catch {
      setData({ sales: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (open) { setPage(1); fetchHistory(1); }
  }, [open, fetchHistory]);

  useEffect(() => {
    if (open) fetchHistory(page);
  }, [page, open, fetchHistory]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const statusConfig: Record<string, { label: string; className: string }> = {
    PAID:    { label: 'Lunas',       className: 'bg-green-100 text-green-800' },
    PENDING: { label: 'Pending',     className: 'bg-yellow-100 text-yellow-800' },
    UNPAID:  { label: 'Belum Lunas', className: 'bg-red-100 text-red-800' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Riwayat Pembelian — {customerName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Memuat...</div>
        ) : !data || data.sales.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Belum ada riwayat pembelian.
          </div>
        ) : (
          <div className="space-y-3">
            {data.sales.map((sale) => {
              const status = statusConfig[sale.paymentStatus] ?? statusConfig.PAID;
              const itemCount = sale.items.reduce((s: number, i: any) => s + i.quantity, 0);
              return (
                <div key={sale.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{sale.saleNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {' · '}{itemCount} item · {sale.paymentMethod}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold text-sm">{formatCurrency(sale.total)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t">
                    {sale.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.variant?.product?.name} – {item.variant?.name} × {item.quantity}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    {sale.ongkir > 0 && (
                      <div className="flex justify-between text-xs text-orange-600">
                        <span>Ongkir</span>
                        <span>+{formatCurrency(sale.ongkir)}</span>
                      </div>
                    )}
                    {sale.discount > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Diskon</span>
                        <span>-{formatCurrency(sale.discount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {data.total} transaksi · Hal. {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
