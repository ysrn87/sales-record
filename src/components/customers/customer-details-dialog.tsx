'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { MemberCard } from '../member/member-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  birthday?: Date | null;
  photoUrl?: string | null;
  points: number;
  createdAt: Date;
  sales: Array<{
    id: string;
    total: any;
  }>;
  _count: {
    sales: number;
  };
}

interface CustomerDetailsDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({ customer, open, onOpenChange }: CustomerDetailsDialogProps) {
  const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const avgPurchase = customer._count.sales > 0 ? totalSpent / customer._count.sales : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4">
            <MemberCard 
              user={{
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                birthday: customer.birthday,
                photoUrl: customer.photoUrl,
                points: customer.points,
                createdAt: customer.createdAt,
              }}
              showMembershipId={true}
            />
          </TabsContent>
          
          <TabsContent value="statistics" className="mt-4 space-y-4">
            {/* Purchase Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Total Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{customer._count.sales}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    💰 Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSpent)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  📊 Average Purchase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(avgPurchase)}</p>
                {customer._count.sales > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {customer._count.sales} transaction{customer._count.sales !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}