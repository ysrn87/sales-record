'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package } from 'lucide-react';

export interface RecapRow {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  totalQty: number;
  totalRevenue: number;
  avgPrice: number;
  totalTransactions: number;
}

interface RecapTableProps {
  rows: RecapRow[];
}

export function RecapTable({ rows }: RecapTableProps) {
  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <Package className="w-10 h-10" />
        <p className="text-sm">Tidak ada data untuk filter yang dipilih.</p>
      </div>
    );
  }

  const maxQty = Math.max(...rows.map((r) => r.totalQty));

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className='text-xs truncate'>
            <TableHead className="w-8">#</TableHead>
            <TableHead>Produk/Varian</TableHead>
            <TableHead className="text-right">Terjual</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Harga (Avg.)</TableHead>
            <TableHead className="text-right">Pendapatan</TableHead>
            <TableHead className="text-right">Transaksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const isTop = row.totalQty === maxQty && maxQty > 0;
            return (
              <TableRow key={row.variantId} className='text-xs'>
                <TableCell className="text-gray-400">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <div>
                      <div className="font-medium text-xs truncate">
                        {row.variantName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        {row.productName}
                        <span>
                          {isTop && (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {row.totalQty.toLocaleString('id-ID')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {row.sku}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatRupiah(row.avgPrice)}
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-700">
                  {formatRupiah(row.totalRevenue)}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {row.totalTransactions.toLocaleString('id-ID')}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
