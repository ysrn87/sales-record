'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createCashflowAction, updateCashflowAction } from '@/actions/cashflow';
import { Plus, Pencil } from 'lucide-react';

interface CashflowDialogProps {
  mode?: 'create' | 'edit';
  transaction?: {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    description: string;
    date: Date;
  };
  trigger?: React.ReactNode;
}

export function CashflowDialog({ mode = 'create', transaction, trigger }: CashflowDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const { toast } = useToast();

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
  const handleNumberChange = (value: string) => {
    const formatted = formatNumber(value);
    setAmount(formatted);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Parse formatted number back to raw number
      formData.set('amount', parseNumber(amount));
      
      const result = mode === 'create'
        ? await createCashflowAction(formData)
        : await updateCashflowAction(transaction!.id, formData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Transaction ${mode === 'create' ? 'recorded' : 'updated'} successfully.`,
        });
        setOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${mode} transaction.`,
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
      setAmount(transaction?.amount?.toString() || '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'sm'}>
            {mode === 'create' ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Transaksi
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent  aria-describedby={undefined} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Pencatatan Arus Kas' : 'Edit Transaction'}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Jenis Transaksi *</Label>
              <Select name="type" required defaultValue={transaction?.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Jumlah *</Label>
              <Input
                id="amount"
                name="amount"
                type="tel"
                required
                value={amount}
                onChange={(e) => handleNumberChange(e.target.value)}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Kategori *</Label>
              <Input
                id="category"
                name="category"
                required
                defaultValue={transaction?.category}
                placeholder="e.g., Sales, Rent, Utilities, Supplies"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                name="description"
                defaultValue={transaction?.description}
                placeholder="Brief description of transaction"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Tanggal *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={
                  transaction?.date 
                    ? new Date(transaction.date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]
                }
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Simpan' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}