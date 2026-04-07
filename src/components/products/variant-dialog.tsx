'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createVariantAction, updateVariantAction } from '@/actions/products';
import { Plus, Pencil } from 'lucide-react';

interface VariantDialogProps {
  mode: 'create' | 'edit';
  productId?: string;
  variant?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock: number;
    lowStock: number;
    points: number;
  };
  trigger?: React.ReactNode;
}

export function VariantDialog({ mode, productId, variant, trigger }: VariantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // State for formatted number inputs
  const [price, setPrice] = useState(variant?.price?.toString() || '');
  const [cost, setCost] = useState(variant?.cost?.toString() || '');
  const [points, setPoints] = useState(variant?.points?.toString() || '0');
  const [stock, setStock] = useState('0');
  const [lowStock, setLowStock] = useState(variant?.lowStock?.toString() || '10');

  // Helper function to format number with commas
  const formatNumber = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Split by decimal point
    const parts = cleanValue.split('.');
    
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return formatted value (limit to 2 decimal places)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  // Helper function to parse formatted number back to raw number
  const parseNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // Handle number input change
  const handleNumberChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const formatted = formatNumber(value);
    setter(formatted);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Parse formatted numbers back to raw numbers
      formData.set('price', parseNumber(price));
      formData.set('cost', parseNumber(cost));
      formData.set('points', parseNumber(points));
      formData.set('lowStock', parseNumber(lowStock));
      
      if (mode === 'create') {
        formData.set('stock', parseNumber(stock));
      }

      if (mode === 'create' && productId) {
        formData.append('productId', productId);
      }

      const result = mode === 'create' 
        ? await createVariantAction(formData)
        : await updateVariantAction(variant!.id, formData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Variant ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });
        setOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${mode} variant.`,
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
      setPrice(variant?.price?.toString() || '');
      setCost(variant?.cost?.toString() || '');
      setPoints(variant?.points?.toString() || '0');
      setStock('0');
      setLowStock(variant?.lowStock?.toString() || '10');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === 'create' ? 'outline' : 'ghost'} size="sm">
            {mode === 'create' ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Varian
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Varian Baru' : 'Edit Varian'}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Varian *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={variant?.name}
                placeholder="e.g., Small - Black, 32x32 - Blue"
                disabled={loading}
                maxLength={30}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                required
                defaultValue={variant?.sku}
                placeholder="e.g., TSH-001-S-BLK"
                disabled={loading}
                maxLength={15}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Harga *</Label>
                <Input
                  id="price"
                  name="price"
                  type="tel"
                  required
                  value={price}
                  onChange={(e) => handleNumberChange(e.target.value, setPrice)}
                  placeholder="0"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cost">Modal (cost) *</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="tel"
                  required
                  value={cost}
                  onChange={(e) => handleNumberChange(e.target.value, setCost)}
                  placeholder="0"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="points">Poin/item</Label>
              <Input
                id="points"
                name="points"
                type="tel"
                value={points}
                onChange={(e) => handleNumberChange(e.target.value, setPoints)}
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Poin yang didapatkan member untuk pembelian tiap unit
              </p>
            </div>

            {mode === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stok Awal *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="tel"
                    required
                    value={stock}
                    onChange={(e) => handleNumberChange(e.target.value, setStock)}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lowStock">Low Stock Alert *</Label>
                  <Input
                    id="lowStock"
                    name="lowStock"
                    type="tel"
                    required
                    value={lowStock}
                    onChange={(e) => handleNumberChange(e.target.value, setLowStock)}
                    placeholder="10"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {mode === 'edit' && (
              <div className="grid gap-2">
                <Label htmlFor="lowStock">Low Stock Alert *</Label>
                <Input
                  id="lowStock"
                  name="lowStock"
                  type="tel"
                  required
                  value={lowStock}
                  onChange={(e) => handleNumberChange(e.target.value, setLowStock)}
                  placeholder="10"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Buat Varian' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}