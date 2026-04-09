import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomersTable } from '@/components/customers/customers-table';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { NonMemberDialog } from '@/components/customers/non-member-dialog';
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

  // Build where clause for members
  const memberWhere: any = { role: 'MEMBER' };
  
  // Search across name, phone, and email
  if (search) {
    memberWhere.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  // Filter by points range (only for members)
  if (points !== 'all') {
    switch (points) {
      case 'low':
        memberWhere.points = { lt: 100 };
        break;
      case 'medium':
        memberWhere.points = { gte: 100, lt: 500 };
        break;
      case 'high':
        memberWhere.points = { gte: 500 };
        break;
    }
  }

  // Build where clause for non-members
  const nonMemberWhere: any = {};
  if (search) {
    nonMemberWhere.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { address: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  // Fetch both members and non-members
  const [members, nonMembers] = await Promise.all([
    db.user.findMany({
      where: memberWhere,
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
    db.customer.findMany({
      where: nonMemberWhere,
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
  ]);

  // Convert and add type field
  const serializedMembers = members.map((customer) => ({
    ...customer,
    type: 'member' as const,
    sales: customer.sales.map((sale) => ({
      id: sale.id,
      total: Number(sale.total),
    })),
  }));

  const serializedNonMembers = nonMembers.map((customer) => ({
    ...customer,
    address: customer.address ?? '',
    type: 'non-member' as const,
    sales: customer.sales.map((sale) => ({
      id: sale.id,
      total: Number(sale.total),
    })),
  }));

  // Combine both types
  let allCustomers = [...serializedMembers, ...serializedNonMembers];

  // Build orderBy - apply sorting
  switch (sort) {
    case 'name_asc':
      allCustomers.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      allCustomers.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'points_asc':
      allCustomers.sort((a, b) => {
        const aPoints = a.type === 'member' ? a.points : 0;
        const bPoints = b.type === 'member' ? b.points : 0;
        return aPoints - bPoints;
      });
      break;
    case 'points_desc':
      allCustomers.sort((a, b) => {
        const aPoints = a.type === 'member' ? a.points : 0;
        const bPoints = b.type === 'member' ? b.points : 0;
        return bPoints - aPoints;
      });
      break;
    case 'joined_asc':
      allCustomers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'joined_desc':
      allCustomers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    default:
      allCustomers.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = allCustomers.length;
  
  // Apply pagination
  const paginatedCustomers = allCustomers.slice(skip, skip + limit);

  return { customers: paginatedCustomers, total };
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex justify-between items-center">
        {/* Desktop buttons */}
        <div className="hidden sm:flex gap-2">
          <NonMemberDialog mode="create" />
          <CustomerDialog mode="create" />
        </div>
      </div>

      {/* Mobile FAB — opens non-member dialog */}
      <div className="sm:hidden fixed bottom-24 right-6 z-50">
        <NonMemberDialog
          mode="create"
          trigger={
            <button className="w-12 h-12 rounded-full bg-[#028697] text-white shadow-lg flex items-center justify-center hover:bg-[#028697]/90 active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Daftar Pelanggan</CardTitle>
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