'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { adjustStockAction } from '@/actions/stock';
import { Plus, Minus, PackageX } from 'lucide-react';

interface StockAdjustmentDialogProps {
  variantId: string;
  variantName: string;
  currentStock: number;
}

export function StockAdjustmentDialog({ variantId, variantName, currentStock }: StockAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState('');
  const { toast } = useToast();

  // Helper function to format number with commas
  const formatNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    // Add commas to the integer part
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Helper function to parse formatted number back to raw number
  const parseNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // Handle number input change
  const handleNumberChange = (value: string) => {
    const formatted = formatNumber(value);
    setQuantity(formatted);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Parse formatted number back to raw number
      formData.set('quantity', parseNumber(quantity));
      
      const result = await adjustStockAction(formData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Penyesuaian stok berhasil.',
        });
        setOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Gagal atur stok.',
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

  // Reset form values when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setQuantity('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Atur Stok
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atur Stok</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <input type="hidden" name="variantId" value={variantId} />
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Produk</Label>
              <p className="text-sm font-medium">{variantName}</p>
            </div>

            <div className="grid gap-2">
              <Label>Stok Saat Ini</Label>
              <p className="text-2xl font-bold">{currentStock.toLocaleString()} units</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Movement Type *</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Stock Masuk (Tambah)
                    </div>
                  </SelectItem>
                  <SelectItem value="OUT">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Stok Keluar (Kurangi)
                    </div>
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    <div className="flex items-center gap-2">
                      <PackageX className="h-4 w-4 text-blue-600" />
                      Penyesuaian
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Kuantitas *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="tel"
                required
                value={quantity}
                onChange={(e) => handleNumberChange(e.target.value)}
                placeholder="Input jumlah"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Keterangan (Optional)</Label>
              <Input
                id="reason"
                name="reason"
                placeholder="e.g., Restocking, Barang rusak"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adjusting...' : 'Atur Stok'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}