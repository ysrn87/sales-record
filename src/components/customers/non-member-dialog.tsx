'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createNonMemberAction, updateNonMemberAction } from '@/actions/members';
import { Plus, Pencil } from 'lucide-react';

interface NonMemberDialogProps {
  mode: 'create' | 'edit';
  customer?: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
  };
  trigger?: React.ReactNode;
  onSuccess?: (id?: string, name?: string) => void;
}

export function NonMemberDialog({ mode, customer, trigger, onSuccess }: NonMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(mode === 'edit' ? (customer?.name || '') : '');
  const [phone, setPhone] = useState(mode === 'edit' ? (customer?.phone || '') : '');
  const [address, setAddress] = useState(mode === 'edit' ? (customer?.address || '') : '');
  const { toast } = useToast();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9+]/g, '');
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setPhone(formatted);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const result = mode === 'create'
        ? await createNonMemberAction(formData)
        : await updateNonMemberAction(customer!.id, formData);

      if (result.success) {
        toast({ title: 'Berhasil!', description: mode === 'create' ? 'Pelanggan berhasil ditambahkan.' : 'Data pelanggan diperbarui.' });
        setOpen(false);
        if (mode === 'create') {
          setName(''); setPhone(''); setAddress('');
        }
        if (onSuccess) onSuccess((result as any).customerId, (result as any).customerName);
      } else {
        toast({ title: 'Error', description: (result as any).error || 'Terjadi kesalahan.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan tidak terduga.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'sm'}>
            {mode === 'create' ? <><Plus className="w-4 h-4 mr-2" />Tambah Non-Member</> : <Pencil className="w-4 h-4" />}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tambah Pelanggan Non-Member' : 'Edit Pelanggan Non-Member'}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama <span className="text-red-500">*</span></Label>
              <Input
                id="name" name="name" required
                value={name} onChange={handleNameChange}
                placeholder="Nama Lengkap"
                disabled={loading} maxLength={80}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">No. HP / WhatsApp <span className="text-red-500">*</span></Label>
              <Input
                id="phone" name="phone" type="tel" required
                value={phone} onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  const ctrl = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
                  if (!ctrl.includes(e.key) && !/^[0-9+]$/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
                }}
                minLength={9} maxLength={19} inputMode="tel"
                placeholder="0812 3456 7890" disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Alamat <span className="text-red-500">*</span></Label>
              <Textarea
                id="address" name="address" required
                value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama Jalan, Kota, Kode Pos"
                disabled={loading} maxLength={150} rows={3}
              />
              <p className="text-xs text-gray-500 text-right">{address.length}/150</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Pelanggan' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
