import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomersTable } from '@/components/customers/customers-table';
import { NonMembersTable } from '@/components/customers/non-members-table';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { NonMemberDialog } from '@/components/customers/non-member-dialog';
import { SearchFilterBar } from '@/components/filters/search-filter-bar';
import { getNonMemberCustomers } from '@/actions/members';

async function getMembers(params: {
  page?: number;
  limit?: number;
  search?: string;
  points?: string;
  sort?: string;
}) {
  const { page = 1, limit = 10, search = '', points = 'all', sort = 'name_asc' } = params;
  const skip = (page - 1) * limit;

  const where: any = { role: 'MEMBER' };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  if (points !== 'all') {
    switch (points) {
      case 'low':    where.points = { lt: 100 }; break;
      case 'medium': where.points = { gte: 100, lt: 500 }; break;
      case 'high':   where.points = { gte: 500 }; break;
    }
  }

  const orderBy: any = [];
  switch (sort) {
    case 'name_desc':   orderBy.push({ name: 'desc' }); break;
    case 'points_asc':  orderBy.push({ points: 'asc' }); break;
    case 'points_desc': orderBy.push({ points: 'desc' }); break;
    case 'joined_asc':  orderBy.push({ createdAt: 'asc' }); break;
    case 'joined_desc': orderBy.push({ createdAt: 'desc' }); break;
    default:            orderBy.push({ name: 'asc' });
  }

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where, skip, take: limit, orderBy,
      include: {
        sales: { select: { id: true, total: true } },
        _count: { select: { sales: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    customers: customers.map((c: typeof customers[number]) => ({
      ...c,
      sales: c.sales.map((s: typeof c.sales[number]) => ({ id: s.id, total: Number(s.total) })),
    })),
    total,
  };
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    limit?: string;
    search?: string;
    points?: string;
    sort?: string;
    nm_page?: string;
    nm_limit?: string;
    nm_search?: string;
    nm_sort?: string;
  }>;
}) {
  const params = await searchParams;

  const activeTab = params.tab || 'member';

  const page   = Number(params.page)  || 1;
  const limit  = Number(params.limit) || 10;
  const search = params.search || '';
  const points = params.points || 'all';
  const sort   = params.sort   || 'name_asc';

  const nmPage   = Number(params.nm_page)  || 1;
  const nmLimit  = Number(params.nm_limit) || 10;
  const nmSearch = params.nm_search || '';
  const nmSort   = params.nm_sort   || 'name_asc';

  const [{ customers, total }, { customers: nonMembers, total: nmTotal }] = await Promise.all([
    getMembers({ page, limit, search, points, sort }),
    getNonMemberCustomers({ page: nmPage, limit: nmLimit, search: nmSearch, sort: nmSort }),
  ]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="member">Member ({total})</TabsTrigger>
            <TabsTrigger value="non-member">Non-Member ({nmTotal})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <TabsContent value="member" className="mt-0">
              <CustomerDialog mode="create" />
            </TabsContent>
            <TabsContent value="non-member" className="mt-0">
              <NonMemberDialog mode="create" />
            </TabsContent>
          </div>
        </div>

        <TabsContent value="member" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Daftar Member</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SearchFilterBar
                searchPlaceholder="Cari nama, HP, atau email..."
                filters={[
                  {
                    key: 'points',
                    label: 'Points Range',
                    defaultValue: 'all',
                    options: [
                      { value: 'all',    label: 'All Points' },
                      { value: 'low',    label: '< 100 points' },
                      { value: 'medium', label: '100-499 points' },
                      { value: 'high',   label: '500+ points' },
                    ],
                  },
                ]}
                sortOptions={[
                  { value: 'name_asc',    label: 'Name (A-Z)' },
                  { value: 'name_desc',   label: 'Name (Z-A)' },
                  { value: 'points_desc', label: 'Highest Points' },
                  { value: 'points_asc',  label: 'Lowest Points' },
                  { value: 'joined_desc', label: 'Recently Joined' },
                  { value: 'joined_asc',  label: 'Oldest Members' },
                ]}
                defaultSort="name_asc"
              />
              <CustomersTable
                customers={customers}
                showActions={true}
                currentPage={page}
                pageSize={limit}
                totalItems={total}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="non-member" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Daftar Pelanggan Non-Member</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <SearchFilterBar
                searchPlaceholder="Cari nama atau nomor HP..."
                filters={[]}
                sortOptions={[
                  { value: 'name_asc',    label: 'Name (A-Z)' },
                  { value: 'name_desc',   label: 'Name (Z-A)' },
                  { value: 'joined_desc', label: 'Terbaru' },
                  { value: 'joined_asc',  label: 'Terlama' },
                ]}
                defaultSort="name_asc"
              />
              <NonMembersTable
                customers={nonMembers}
                showActions={true}
                currentPage={nmPage}
                pageSize={nmLimit}
                totalItems={nmTotal}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}