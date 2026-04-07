'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { upgradeToMemberAction } from '@/actions/customers';
import { UserCog } from 'lucide-react';

interface UpgradeToMemberDialogProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
}

export function UpgradeToMemberDialog({ customer }: UpgradeToMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const { toast } = useToast();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(val && !valid ? 'Please enter a valid email address' : '');
  };

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    
    // Validate email if provided
    if (email && emailError) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await upgradeToMemberAction(customer.id, formData);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `${customer.name} has been upgraded to member.`,
        });
        setOpen(false);
        // Reload the page to reflect changes
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to upgrade customer.',
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setName(customer.name); setPhone(customer.phone); setAddress(customer.address); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Upgrade to Member">
          <UserCog className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upgrade to Member</DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900">
            <strong>{name || customer.name}</strong> will be upgraded to a member account with:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Login access to member portal</li>
            <li>Ability to earn and redeem loyalty points</li>
            <li>Purchase history preserved</li>
          </ul>
        </div>

        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Editable customer info */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">
                Telepon/WA <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">
                Alamat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* New fields for member upgrade */}
            <div className="border-t pt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  minLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for member login
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  onChange={handleEmailChange}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  disabled={loading}
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  name="birthday"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input
                  id="photoUrl"
                  name="photoUrl"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Upgrading...' : 'Upgrade to Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}