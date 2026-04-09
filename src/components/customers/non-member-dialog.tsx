'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createNonMemberCustomerAction, updateNonMemberCustomerAction } from '@/actions/customers';
import { Pencil, Plus, UserPlus } from 'lucide-react';

type CreateProps = {
  mode: 'create';
  customer?: never;
  trigger?: React.ReactNode;
};

type EditProps = {
  mode: 'edit';
  customer: { id: string; name: string; phone: string; address: string };
  trigger?: React.ReactNode;
};

type NonMemberDialogProps = CreateProps | EditProps;

export function NonMemberDialog({ mode, customer, trigger }: NonMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(mode === 'edit' ? customer.name : '');
  const [phone, setPhone] = useState(mode === 'edit' ? customer.phone : '');
  const [address, setAddress] = useState(mode === 'edit' ? customer.address : '');
  const { toast } = useToast();

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      if (mode === 'edit') {
        setName(customer.name);
        setPhone(customer.phone);
        setAddress(customer.address);
      } else {
        setName('');
        setPhone('');
        setAddress('');
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9+]/g, '');
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setPhone(formatted);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const result =
        mode === 'create'
          ? await createNonMemberCustomerAction(formData)
          : await updateNonMemberCustomerAction(customer.id, formData);

      if (result.success) {
        toast({
          title: 'Berhasil!',
          description:
            mode === 'create'
              ? 'Pelanggan berhasil ditambahkan.'
              : 'Data pelanggan berhasil diperbarui.',
        });
        setOpen(false);
      } else {
        toast({ title: 'Error', description: result.error || 'Gagal menyimpan data.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger =
    mode === 'create' ? (
      <Button>
        <UserPlus className="w-4 h-4 mr-2" />
        Tambah Non-Member
      </Button>
    ) : (
      <Button variant="ghost" size="sm" title="Edit Pelanggan" className="group">
        <Pencil className="w-4 h-4 text-white group-hover:text-slate-900 transition-colors" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nm-name">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nm-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                maxLength={80}
                placeholder="Nama Lengkap"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nm-phone">
                Telepon/WA <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nm-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                  if (!controlKeys.includes(e.key) && !/^[0-9+]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                inputMode="tel"
                required
                disabled={loading}
                minLength={9}
                maxLength={19}
                placeholder="0812 3456 7890"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nm-address">
                Alamat <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="nm-address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
                maxLength={150}
                placeholder="Nama Jalan, Kota, Kode Pos"
              />
              <p className="text-xs text-gray-500 text-right">{address.length}/150 karakter</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Pelanggan' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}