'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createProductAction, updateProductAction } from '@/actions/products';
import { Plus, Pencil } from 'lucide-react';

interface ProductDialogProps {
  mode: 'create' | 'edit';
  product?: {
    id: string;
    name: string;
    description: string | null;
    sku: string;
  };
  trigger?: React.ReactNode;
}

export function ProductDialog({ mode, product, trigger }: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const result = mode === 'create' 
        ? await createProductAction(formData)
        : await updateProductAction(product!.id, formData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Product ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });
        setOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${mode} product.`,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'sm'}>
            {mode === 'create' ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={product?.name}
                placeholder="e.g., T-Shirt, Jeans, Shoes"
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
                defaultValue={product?.sku}
                placeholder="e.g., TSH-001"
                disabled={loading}
                maxLength={15}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                name="description"
                defaultValue={product?.description || ''}
                placeholder="Brief product description"
                disabled={loading}
                maxLength={150}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Buat Produk' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
