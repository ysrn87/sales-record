'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { updateSaleAction } from '@/actions/sales';
import { Trash2, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EditSaleDialogProps {
  sale: {
    id: string;
    customerId: string | null;
    paymentMethod: string;
    discount: number;
    tax: number;
    notes: string | null;
    pointsRedeemed?: number;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      variant: {
        id: string;
        name: string;
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
  onSuccess?: () => void;
}

interface SaleItem {
  variantId: string;
  variantName: string;
  quantity: number;
  price: number;
  currentStock: number;
}

export function EditSaleDialog({ sale, conversionRate = 1000, open, onOpenChange, onSuccess }: EditSaleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customerId, setCustomerId] = useState<string>(sale.customerId || 'WALK_IN');
  const [paymentMethod, setPaymentMethod] = useState<string>(sale.paymentMethod);
  const [discount, setDiscount] = useState<number>(sale.discount);
  const [tax, setTax] = useState<number>(sale.tax);
  const [notes, setNotes] = useState<string>(sale.notes || '');
  const { toast } = useToast();

  // Get points redeemed from original sale
  const pointsRedeemed = sale.pointsRedeemed || 0;
  const pointDiscount = pointsRedeemed * conversionRate;

  useEffect(() => {
    setItems(sale.items.map(item => ({
      variantId: item.variant.id,
      variantName: `${item.variant.product.name} - ${item.variant.name}`,
      quantity: item.quantity,
      price: item.price,
      currentStock: item.variant.stock + item.quantity, // Add back the current sale quantity to available stock
    })));
  }, [sale]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount - pointDiscount + tax;

  const updateQuantity = (index: number, newQty: number) => {
    const newItems = [...items];
    if (newQty > 0 && newQty <= newItems[index].currentStock) {
      newItems[index].quantity = newQty;
      setItems(newItems);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Penjualan harus ada min. 1 item.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateSaleAction(sale.id, {
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerId: customerId === 'WALK_IN' ? null : customerId,
        paymentMethod,
        discount,
        tax,
        notes: notes || undefined,
        pointsRedeemed: pointsRedeemed,
      });
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Berhasil update penjualan.',
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update sale.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sale</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 sm:gap-6 py-4">
          {/* Items List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Items</h3>
            <div className="border rounded-lg divide-y max-h-[250px] sm:max-h-[300px] overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.variantName}</p>
                    <p className="text-xs text-gray-600">Harga: {formatCurrency(item.price)} • Tersedia: {item.currentStock}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={loading || items.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Input
                      type="number"
                      min="0"
                      max={item.currentStock}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                      className="w-16 sm:w-20"
                      disabled={loading}
                    />
                    <span className="font-semibold w-20 sm:w-24 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Metode Bayar</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tax">Tax</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes - Max 30 karakter</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              disabled={loading}
              maxLength={50}
            />
            <p className="text-xs text-gray-500 text-right">
              {notes.length}/50 characters
            </p>
          </div>

          {/* Point Redemption Info - Read Only */}
          {pointsRedeemed > 0 && (
            <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <h3 className="font-semibold text-sm sm:text-base text-purple-900">Point Redeemed (Tidak dapat diubah)</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-purple-700">
                  <strong>{pointsRedeemed} point</strong> telah ditukar untuk transaksi ini
                </p>
                <p className="text-xs sm:text-sm text-purple-600">
                  Point Discount: <strong>{formatCurrency(pointDiscount)}</strong>
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Penukaran poin tidak dapat diubah. Poin asli tetap berlaku untuk penjualan ini.
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {pointsRedeemed > 0 && (
              <div className="flex justify-between text-sm text-purple-600 font-medium">
                <span className="text-xs sm:text-sm">Discount ({pointsRedeemed} poin):</span>
                <span>-{formatCurrency(pointDiscount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || items.length === 0} className="w-full sm:w-auto">
            {loading ? 'Updating...' : 'Update Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}