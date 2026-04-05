import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Package, ShoppingCart, Users } from 'lucide-react';

async function getManagerStats() {
  const [totalProducts, totalSales, totalCustomers, recentSales] = await Promise.all([
    db.productVariant.count(),
    db.sale.count(),
    db.user.count({ where: { role: 'MEMBER' } }),
    db.sale.aggregate({
      _sum: { total: true },
    }),
  ]);

  return {
    totalProducts,
    totalSales,
    totalCustomers,
    totalRevenue: recentSales._sum.total || 0,
  };
}

async function getRecentSales() {
  return db.sale.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: { name: true },
      },
    },
  });
}

export default async function ManagerDashboard() {
  const stats = await getManagerStats();
  const recentSales = await getRecentSales();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-gray-600">Tinjau performa toko Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">varian Produk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan/Omzet</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(stats.totalRevenue))}</div>
            <p className="text-xs text-muted-foreground">Total penjualan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Penjualan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada penjualan</p>
            ) : (
              recentSales.map((sale: typeof recentSales[number]) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sale.saleNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.customer?.name || 'Guest'}
                    </p>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(Number(sale.total))}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
