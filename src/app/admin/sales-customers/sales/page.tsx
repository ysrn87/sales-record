import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewSaleDialog } from '@/components/sales/new-sale-dialog';
import { SalesTable } from '@/components/sales/sales-table';
import { getPointsConversionRate } from '@/actions/settings';
import { SearchFilterBar } from '@/components/filters/search-filter-bar';

async function getSales(params: {
  page?: number;
  limit?: number;
  search?: string;
  payment?: string;
  paymentStatus?: string;
  sort?: string;
}) {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    payment = 'all',
    paymentStatus = 'all',
    sort = 'date_desc'
  } = params;
  
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  // Search across customer name and sale number
  if (search) {
    where.OR = [
      { 
        customer: { 
          name: { contains: search, mode: 'insensitive' as const } 
        } 
      },
      { 
        saleNumber: { contains: search, mode: 'insensitive' as const } 
      },
      {
        cashier: {
          name: { contains: search, mode: 'insensitive' as const }
        }
      }
    ];
  }

  // Filter by payment method
  if (payment !== 'all') {
    where.paymentMethod = payment;
  }

  // Filter by payment status
  if (paymentStatus !== 'all') {
    where.paymentStatus = paymentStatus;
  }

  // Build orderBy clause
  const orderBy: any = [];
  switch (sort) {
    case 'date_asc':
      orderBy.push({ createdAt: 'asc' });
      break;
    case 'date_desc':
      orderBy.push({ createdAt: 'desc' });
      break;
    case 'total_asc':
      orderBy.push({ total: 'asc' });
      break;
    case 'total_desc':
      orderBy.push({ total: 'desc' });
      break;
    default:
      orderBy.push({ createdAt: 'desc' });
  }
  
  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        nonMemberCustomer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
        cashier: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    }),
    db.sale.count({ where }),
  ]);

  return {
    sales: sales.map((sale: typeof sales[number]) => {
      const { subtotal, discount, tax, total, items, ...saleRest } = sale;
      const ongkir = (saleRest as any).ongkir;
      delete (saleRest as any).ongkir;
      return {
        ...saleRest,
        subtotal: Number(subtotal),
        discount: Number(discount),
        tax: Number(tax),
        ongkir: Number(ongkir),
        total: Number(total),
        items: items.map((item: typeof items[number]) => {
          const { price, subtotal: itemSubtotal, variant, ...itemRest } = item;
          const { price: variantPrice, cost: variantCost, ...variantRest } = variant;
          return {
            ...itemRest,
            price: Number(price),
            subtotal: Number(itemSubtotal),
            variant: {
              ...variantRest,
              price: Number(variantPrice),
              cost: Number(variantCost),
            },
          };
        }),
      };
    }),
    total,
  };
}

async function getVariants() {
  const variants = await db.productVariant.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
    },
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  });

  return variants.map((v: typeof variants[number]) => ({
    id: v.id,
    name: v.name,
    price: Number(v.price),
    stock: v.stock,
    points: v.points,
    product: {
      name: v.product.name,
    },
  }));
}

async function getCustomers() {
  return db.user.findMany({
    where: { role: 'MEMBER' },
    select: {
      id: true,
      name: true,
      points: true,
    },
    orderBy: { name: 'asc' },
  });
}

async function getNonMemberCustomers() {
  return db.customer.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
    },
    orderBy: { name: 'asc' },
  });
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    limit?: string;
    search?: string;
    payment?: string;
    paymentStatus?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const search = params.search || '';
  const payment = params.payment || 'all';
  const paymentStatus = params.paymentStatus || 'all';
  const sort = params.sort || 'date_desc';

  const [{ sales, total }, variants, customers, nonMemberCustomers, conversionRate] = await Promise.all([
    getSales({ page, limit, search, payment, paymentStatus, sort }),
    getVariants(),
    getCustomers(),
    getNonMemberCustomers(),
    getPointsConversionRate(),
  ]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex justify-between items-center">
        <NewSaleDialog
          variants={variants}
          customers={customers}
          nonMemberCustomers={nonMemberCustomers}
          conversionRate={conversionRate}
          aria-describedby={undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Penjualan Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter Bar */}
          <SearchFilterBar
            searchPlaceholder="Search by customer name, sale number, or cashier..."
            filters={[
              {
                key: 'payment',
                label: 'Payment Method',
                defaultValue: 'all',
                options: [
                  { value: 'all', label: 'All Methods' },
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'TRANSFER', label: 'Bank Transfer' },
                ],
              },
              {
                key: 'paymentStatus',
                label: 'Status Pembayaran',
                defaultValue: 'all',
                options: [
                  { value: 'all', label: 'Semua Status' },
                  { value: 'PAID', label: 'Lunas' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'UNPAID', label: 'Belum Lunas' },
                ],
              },
            ]}
            sortOptions={[
              { value: 'date_desc', label: 'Newest First' },
              { value: 'date_asc', label: 'Oldest First' },
              { value: 'total_desc', label: 'Highest Amount' },
              { value: 'total_asc', label: 'Lowest Amount' },
            ]}
            defaultSort="date_desc"
          />

          {/* Sales Table */}
          <SalesTable 
            sales={sales} 
            currentPage={page}
            pageSize={limit}
            totalItems={total}
            conversionRate={conversionRate}
          />
        </CardContent>
      </Card>
    </div>
  );
}