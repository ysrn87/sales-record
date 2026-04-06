'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { upgradeToMemberAction } from '@/actions/members';
import { ArrowUpCircle } from 'lucide-react';

interface UpgradeToMemberDialogProps {
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  onSuccess?: () => void;
}

export function UpgradeToMemberDialog({ customer, onSuccess }: UpgradeToMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const result = await upgradeToMemberAction(customer.id, formData);
      if (result.success) {
        toast({ title: 'Berhasil!', description: `${customer.name} telah diupgrade menjadi Member.` });
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({ title: 'Error', description: result.error || 'Gagal upgrade.', variant: 'destructive' });
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
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Upgrade ke Member">
          <ArrowUpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Upgrade ke Member</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Upgrade <strong>{customer.name}</strong> ({customer.phone}) menjadi Member dengan akun login.
          </p>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email (Opsional)</Label>
              <Input
                id="email" name="email" type="email"
                placeholder="john@example.com"
                onChange={(e) => {
                  const val = e.target.value;
                  const valid = !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                  setEmailError(valid ? '' : 'Format email tidak valid');
                }}
                disabled={loading}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password" name="password" type="password" required
                placeholder="Min. 6 karakter" minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Member akan login menggunakan No. HP dan password ini.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading || !!emailError} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Memproses...' : 'Upgrade ke Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
