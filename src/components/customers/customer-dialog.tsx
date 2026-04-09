'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { createCustomerAction, updateCustomerAction } from '@/actions/members';
import { Plus, Pencil } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface CustomerDialogProps {
  mode: 'create' | 'edit';
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
    birthday?: Date;
    photoUrl?: string;
    points: number;
  };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CustomerDialog({ mode, customer, trigger, onSuccess }: CustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(customer?.photoUrl || '');
  const [points, setPoints] = useState(customer?.points || 0);
  const [initialPoints] = useState(customer?.points || 0);
  const { toast } = useToast();

  // Sync photoUrl and points state when dialog opens or customer changes
  useEffect(() => {
    if (open) {
      setPhotoUrl(customer?.photoUrl || '');
      setPoints(customer?.points || 0);
    }
  }, [open, customer?.photoUrl, customer?.points]);

  const pointsChanged = mode === 'edit' && points !== initialPoints;

  const handleSubmit = async (formData: FormData) => {
    // Validate points reason if points changed
    if (mode === 'edit' && pointsChanged) {
      const pointsReason = formData.get('pointsReason') as string;
      if (!pointsReason || pointsReason.trim() === '') {
        toast({
          title: 'Error',
          description: 'Please provide a reason for changing loyalty points.',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const result = mode === 'create'
        ? await createCustomerAction(formData)
        : await updateCustomerAction(customer!.id, formData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Customer ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${mode} customer.`,
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

  
  const [name, setName] = useState(mode === 'edit' ? (customer?.name || '') : '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()));
  };

  const [phone, setPhone] = useState(mode === 'edit' ? (customer?.phone || '') : '')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9+]/g, '');
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setPhone(formatted);
  };

  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(val && !valid ? 'Masukkan alamat email yang valid' : '');
  };

  const [address, setAddress] = useState(mode === 'edit' ? (customer?.address || '') : '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'sm'} className={mode === 'edit' ? 'group' : ''}>
            {mode === 'create' ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Member
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 text-white group-hover:text-slate-900 transition-colors" />
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Tambah Member' : 'Edit Member'}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                placeholder="Nama Lengkap"
                onChange={handleNameChange}
                disabled={loading}
                maxLength={80}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">No. WhatsApp *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                  if (!controlKeys.includes(e.key) && !/^[0-9+]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                minLength={9}  // 7 digits + 2 auto-added spaces
                maxLength={19} // 15 digits + 4 auto-added spaces
                inputMode="tel"
                required
                value={phone}
                placeholder="0812 3456 7890"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email}
                placeholder="john@example.com"                
                onChange={handleEmailChange}
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                disabled={loading}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Alamat <span className="text-red-500">*</span></Label>
              <Textarea
                id="address"
                name="address"
                value={address}
                defaultValue={customer?.address}
                placeholder="Nama Jalan, Kota, Kode Pos"
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                required
                maxLength={250}
              />
            <p className="text-xs text-gray-500 text-right">
              {address.length}/250 karakter
            </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="birthday">Tanggal Lahir</Label>
              <Input
                id="birthday"
                name="birthday"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                defaultValue={customer?.birthday ? new Date(customer.birthday).toISOString().split('T')[0] : ''}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photoUrl">Photo URL</Label>
              <div className="flex gap-3 items-start">
                <Avatar className="w-16 h-16 border-2 border-gray-200">
                  <AvatarImage 
                    src={photoUrl || undefined} 
                    alt="Preview"
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {customer?.name?.slice(0, 2).toUpperCase() || 'PH'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    id="photoUrl"
                    name="photoUrl"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a direct link to the customer's photo
                  </p>
                </div>
              </div>
            </div>

            {mode === 'create' && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Min. 6 karakter"
                  minLength={6}
                  disabled={loading}
                />
              </div>
            )}

            {mode === 'edit' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="points">Loyalty Points</Label>
                  <Input
                    id="points"
                    name="points"
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {initialPoints} points
                  </p>
                </div>

                {pointsChanged && (
                  <div className="grid gap-2">
                    <Label htmlFor="pointsReason" className="flex items-center gap-1">
                      Keterangan perubahan poin
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pointsReason"
                      name="pointsReason"
                      type="text"
                      required={pointsChanged}
                      placeholder="e.g., Promotional bonus, Error correction, etc."
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {points > initialPoints 
                        ? `Adding ${points - initialPoints} points` 
                        : `Deducting ${initialPoints - points} points`}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="password" className='text-red-600'>Ubah Password (Optional)</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Konfirmasi member jika ada perubahan"
                    minLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground text-red-600">
                    Min. 6 karakter. Biarkan kosong untuk tetap password saat ini
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Register Member' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}