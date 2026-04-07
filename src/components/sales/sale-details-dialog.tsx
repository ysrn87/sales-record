'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, Pencil, Gift } from 'lucide-react';
import { EditSaleDialog } from './edit-sale-dialog';

interface SaleDetailsDialogProps {
  sale: {
    id: string;
    saleNumber: string;
    customerId: string | null;
    createdAt: Date;
    subtotal: number;
    discount: number;
    tax: number;
    ongkir: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    notes: string | null;
    pointsEarned: number;
    pointsRedeemed?: number;
    customer: {
      name: string;
      email: string;
      phone?: string | null;
    } | null;
    cashier: {
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      subtotal: number;
      variant: {
        id: string;
        name: string;
        sku: string;
        stock: number;
        product: {
          name: string;
        };
      };
    }>;
  };
  conversionRate?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function SaleDetailsDialog({ sale, conversionRate = 1000, open, onOpenChange, onUpdate }: SaleDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const pointsRedeemed = sale.pointsRedeemed || 0;
  const pointDiscount = pointsRedeemed * conversionRate;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${sale.saleNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 5px 0; color: #666; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .details-box { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .details-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
          .details-box p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
          td { padding: 12px; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .totals-row.total { font-size: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 12px; margin-top: 12px; }
          .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Invoice Number: ${sale.saleNumber}</p>
          <p>Date: ${formatDateTime(sale.createdAt)}</p>
        </div>

        <div class="details">
          <div class="details-box">
            <h3>BILL TO</h3>
            ${sale.customer ? `
              <p><strong>${sale.customer.name}</strong></p>
              <p>${sale.customer.email}</p>
            ` : `
              <p><strong>Pelanggan Umum</strong></p>
            `}
          </div>
          <div class="details-box">
            <h3>PAYMENT INFO</h3>
            <p><strong>Method:</strong> ${sale.paymentMethod}</p>
            <p><strong>Status:</strong> ${sale.paymentStatus === 'PAID' ? 'Lunas' : sale.paymentStatus === 'PENDING' ? 'Pending' : 'Belum Lunas'}</p>
            <p><strong>Cashier:</strong> ${sale.cashier.name}</p>
            ${sale.customer && sale.pointsEarned > 0 ? `<p><strong>Points Earned:</strong> ${sale.pointsEarned}</p>` : ''}
            ${pointsRedeemed > 0 ? `<p style="color: purple;"><strong>Points Redeemed:</strong> ${pointsRedeemed} pts</p>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>
                  <strong>${item.variant.product.name}</strong><br>
                  <small style="color: #666;">${item.variant.name} (${item.variant.sku})</small>
                </td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(sale.subtotal)}</span>
          </div>
          ${sale.discount > 0 ? `
            <div class="totals-row" style="color: green;">
              <span>Discount:</span>
              <span>-${formatCurrency(sale.discount)}</span>
            </div>
          ` : ''}
          ${pointsRedeemed > 0 ? `
            <div class="totals-row" style="color: purple;">
              <span>Discount (${pointsRedeemed} poin):</span>
              <span>-${formatCurrency(pointDiscount)}</span>
            </div>
          ` : ''}
          ${sale.tax > 0 ? `
            <div class="totals-row">
              <span>Tax:</span>
              <span>${formatCurrency(sale.tax)}</span>
            </div>
          ` : ''}
          ${sale.ongkir > 0 ? `
            <div class="totals-row" style="color: orange;">
              <span>Ongkir:</span>
              <span>+${formatCurrency(sale.ongkir)}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>TOTAL:</span>
            <span>${formatCurrency(sale.total)}</span>
          </div>
        </div>

        ${sale.notes ? `
          <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <strong>Notes:</strong><br>
            ${sale.notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice.</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            Print Invoice
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <DialogTitle>Sale Details</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {sale.saleNumber} • {formatDateTime(sale.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-initial">
                  <Printer className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print Invoice</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="flex-1 sm:flex-initial">
                  <Pencil className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Pelanggan</h4>
                {sale.customer ? (
                  <>
                    <p className="text-sm font-medium">{sale.customer.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{sale.customer.email}</p>
                    {sale.pointsEarned > 0 && (
                      <p className="text-xs sm:text-sm text-blue-600 mt-2">+{sale.pointsEarned} poin bertambah</p>
                    )}
                    {pointsRedeemed > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        <p className="text-xs sm:text-sm text-purple-600 font-medium">-{pointsRedeemed} poin ditukar</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Pelanggan Umum</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Pembayaran</h4>
                <p className="text-xs sm:text-sm"><span className="text-gray-600">Metode:</span> {sale.paymentMethod}</p>
                <p className="text-xs sm:text-sm"><span className="text-gray-600">Cashier:</span> {sale.cashier.name}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    sale.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : sale.paymentStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sale.paymentStatus === 'PAID' ? 'Lunas' : sale.paymentStatus === 'PENDING' ? 'Pending' : 'Belum Lunas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium mb-3 text-sm sm:text-base">Items</h4>
              <div className="border rounded-lg divide-y">
                {sale.items.map((item) => (
                  <div key={item.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{item.variant.product.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{item.variant.name} • SKU: {item.variant.sku}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-sm sm:text-base">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              {pointsRedeemed > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-purple-600 font-medium">
                  <span>Discount ({pointsRedeemed} poin)</span>
                  <span>-{formatCurrency(pointDiscount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(sale.tax)}</span>
                </div>
              )}
              {sale.ongkir > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-orange-600">
                  <span>Ongkir</span>
                  <span className="font-medium">+{formatCurrency(sale.ongkir)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base text-blue-900">Notes</h4>
                <p className="text-xs sm:text-sm text-blue-800">{sale.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <EditSaleDialog
          sale={sale}
          conversionRate={conversionRate}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => {
            setShowEditDialog(false);
            onOpenChange(false);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </>
  );
}