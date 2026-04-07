'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Package } from 'lucide-react';
import { MemberCard } from '../member/member-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCustomerPurchaseHistory } from '@/actions/customers';
import { CustomerDialog } from './customer-dialog';
import { CustomerDeleteButton } from './customer-delete-button';
import { NonMemberDialog } from './non-member-dialog';
import { UpgradeToMemberDialog } from './upgrade-to-member-dialog';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { deleteNonMemberCustomerAction } from '@/actions/customers';

interface MemberCustomer {
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
  type: 'member';
}

interface NonMemberCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  sales: Array<{
    id: string;
    total: any;
  }>;
  _count: {
    sales: number;
  };
  type: 'non-member';
}

type Customer = MemberCustomer | NonMemberCustomer;

interface CustomerDetailsDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActions?: boolean;
}

export function CustomerDetailsDialog({ customer, open, onOpenChange, showActions = false }: CustomerDetailsDialogProps) {
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const avgPurchase = customer._count.sales > 0 ? totalSpent / customer._count.sales : 0;
  const isMember = customer.type === 'member';

  useEffect(() => {
    if (open) {
      loadPurchaseHistory();
    }
  }, [open, customer.id]);

  const loadPurchaseHistory = async () => {
    setLoading(true);
    try {
      const history = await getCustomerPurchaseHistory(customer.id, !isMember);
      setPurchaseHistory(history);
    } catch (error) {
      console.error('Failed to load purchase history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <DialogTitle>Customer Profile</DialogTitle>
            {showActions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {isMember ? (
                  <>
                    <CustomerDialog
                      mode="edit"
                      customer={{
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address ?? undefined,
                        email: customer.email ?? undefined,
                        birthday: customer.birthday ?? undefined,
                        photoUrl: customer.photoUrl ?? undefined,
                        points: customer.points,
                      }}
                    />
                    <CustomerDeleteButton customerId={customer.id} />
                  </>
                ) : (
                  <>
                    <NonMemberDialog
                      customer={{
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address,
                      }}
                    />
                    <UpgradeToMemberDialog
                      customer={{
                        id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address,
                      }}
                    />
                    <DeleteConfirmDialog
                      title="Hapus Non-Member"
                      description="Yakin ingin menghapus pelanggan ini? Pelanggan tidak dapat dihapus jika memiliki riwayat transaksi."
                      onConfirm={() => deleteNonMemberCustomerAction(customer.id)}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4 overflow-y-auto">
            {isMember ? (
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
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {customer.name}
                    <Badge variant="secondary">Non-Member</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Since</p>
                    <p className="font-medium">
                      {new Date(customer.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="statistics" className="mt-4 space-y-4 overflow-y-auto">
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

          <TabsContent value="history" className="mt-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading purchase history...</p>
              </div>
            ) : purchaseHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No purchase history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchaseHistory.map((sale) => (
                  <Card key={sale.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{sale.saleNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sale.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(sale.total)}</p>
                          <Badge variant="outline" className="text-xs">
                            {sale.paymentMethod}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sale.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.variant.product.name} - {item.variant.name}
                            </span>
                            <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                        {sale.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 pt-2 border-t">
                            <span>Discount</span>
                            <span>-{formatCurrency(sale.discount)}</span>
                          </div>
                        )}
                        {isMember && sale.pointsRedeemed > 0 && (
                          <div className="flex justify-between text-sm text-purple-600">
                            <span>Points Redeemed</span>
                            <span>{sale.pointsRedeemed} points</span>
                          </div>
                        )}
                        {isMember && sale.pointsEarned > 0 && (
                          <div className="flex justify-between text-sm text-blue-600">
                            <span>Points Earned</span>
                            <span>+{sale.pointsEarned} points</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}