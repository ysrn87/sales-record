import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomersTable } from '@/components/customers/customers-table';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { SearchFilterBar } from '@/components/filters/search-filter-bar';

async function getCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  points?: string;
  sort?: string;
}) {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    points = 'all',
    sort = 'name_asc'
  } = params;
  
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { role: 'MEMBER' };
  
  // Search across name, phone, and email
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  // Filter by points range
  if (points !== 'all') {
    switch (points) {
      case 'low':
        where.points = { lt: 100 };
        break;
      case 'medium':
        where.points = { gte: 100, lt: 500 };
        break;
      case 'high':
        where.points = { gte: 500 };
        break;
    }
  }

  // Build orderBy clause
  const orderBy: any = [];
  switch (sort) {
    case 'name_asc':
      orderBy.push({ name: 'asc' });
      break;
    case 'name_desc':
      orderBy.push({ name: 'desc' });
      break;
    case 'points_asc':
      orderBy.push({ points: 'asc' });
      break;
    case 'points_desc':
      orderBy.push({ points: 'desc' });
      break;
    case 'joined_asc':
      orderBy.push({ createdAt: 'asc' });
      break;
    case 'joined_desc':
      orderBy.push({ createdAt: 'desc' });
      break;
    default:
      orderBy.push({ name: 'asc' });
  }
  
  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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
    db.user.count({ where }),
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

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    limit?: string;
    search?: string;
    points?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const search = params.search || '';
  const points = params.points || 'all';
  const sort = params.sort || 'name_asc';

  const { customers, total } = await getCustomers({ page, limit, search, points, sort });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <CustomerDialog mode="create" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter Bar */}
          <SearchFilterBar
            searchPlaceholder="Search by name, phone, or email..."
            filters={[
              {
                key: 'points',
                label: 'Points Range',
                defaultValue: 'all',
                options: [
                  { value: 'all', label: 'All Points' },
                  { value: 'low', label: '< 100 points' },
                  { value: 'medium', label: '100-499 points' },
                  { value: 'high', label: '500+ points' },
                ],
              },
            ]}
            sortOptions={[
              { value: 'name_asc', label: 'Name (A-Z)' },
              { value: 'name_desc', label: 'Name (Z-A)' },
              { value: 'points_desc', label: 'Highest Points' },
              { value: 'points_asc', label: 'Lowest Points' },
              { value: 'joined_desc', label: 'Recently Joined' },
              { value: 'joined_asc', label: 'Oldest Members' },
            ]}
            defaultSort="name_asc"
          />

          {/* Customers Table */}
          <CustomersTable 
            customers={customers} 
            showActions={true}
            currentPage={page}
            pageSize={limit}
            totalItems={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}