import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

async function getDashboardStats() {
  const [totalProducts, totalSales, totalCustomers, lowStockItems, recentSales, cashflowSummary] = await Promise.all([
    db.productVariant.count(),
    db.sale.count(),
    db.user.count({ where: { role: 'MEMBER' } }),
    db.productVariant.count({
      where: {
        stock: {
          lte: db.productVariant.fields.lowStock,
        },
      },
    }),
    db.sale.aggregate({
      _sum: { total: true },
    }),
    db.cashflow.aggregate({
      _sum: { amount: true },
      where: { type: 'INCOME' },
    }),
  ]);

  return {
    totalProducts,
    totalSales,
    totalCustomers,
    lowStockItems,
    totalRevenue: recentSales._sum.total || 0,
    totalIncome: cashflowSummary._sum.amount || 0,
  };
}

async function getRecentActivity() {
  const [recentSales, lowStockProducts] = await Promise.all([
    db.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true },
        },
      },
    }),
    db.productVariant.findMany({
      where: {
        stock: {
          lte: db.productVariant.fields.lowStock,
        },
      },
      include: {
        product: true,
      },
      take: 5,
    }),
  ]);

  return { recentSales, lowStockProducts };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const { recentSales, lowStockProducts } = await getRecentActivity();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Beranda Admin</h1>
        <p className="text-gray-600">Selamat datang! Berikut adalah ringkasan toko kamu.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Varian Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Varian produk di stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Transaksi selesai</p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(stats.totalRevenue))}</div>
            <p className="text-xs text-muted-foreground">Total pendapatan penjualan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Stok Menipis ({stats.lowStockItems})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Semua stok produk tersedia</p>
              ) : (
                lowStockProducts.map((variant: typeof lowStockProducts[number]) => (
                  <div key={variant.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{variant.product.name}</p>
                      <p className="text-xs text-muted-foreground">{variant.name}</p>
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      {variant.stock} left
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}