import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Award } from 'lucide-react';
import { CustomersTable } from '@/components/customers/customers-table';

async function getCustomerStats() {
  const [totalCustomers, totalPurchases, totalPoints] = await Promise.all([
    db.user.count({
      where: { role: 'MEMBER' },
    }),
    db.sale.count(),
    db.user.aggregate({
      _sum: { points: true },
      where: { role: 'MEMBER' },
    }),
  ]);

  return {
    totalCustomers,
    totalPurchases,
    totalPoints: totalPoints._sum.points || 0,
  };
}

async function getAllCustomers(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  const [customers, total] = await Promise.all([
    db.user.findMany({
      where: { role: 'MEMBER' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sales: {
          select: {
            id: true,
            total: true,
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
    }),
    db.user.count({ where: { role: 'MEMBER' } }),
  ]);

  // Convert Decimal to Number for client component
  const serializedCustomers = customers.map((customer: typeof customers[number]) => ({
    ...customer,
    sales: customer.sales.map((sale: typeof customer.sales[number]) => ({
      id: sale.id,
      total: Number(sale.total),
    })),
  }));

  return { customers: serializedCustomers, total };
}

export default async function ManagerCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const stats = await getCustomerStats();
  const { customers, total } = await getAllCustomers(page, limit);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kelola Pelanggan</h1>
          <p className="text-gray-600">Lihat akun dan aktifitas pelanggan</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Member terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">Semua transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akumulasi Poin</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">Loyalty points</p>
          </CardContent>
        </Card>
      </div>

      {/* All Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersTable 
            customers={customers} 
            showActions={false}
            currentPage={page}
            pageSize={limit}
            totalItems={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}