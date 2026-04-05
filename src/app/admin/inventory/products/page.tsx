import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { ProductDialog } from '@/components/products/product-dialog';
import { VariantDialog } from '@/components/products/variant-dialog';
import { ProductDeleteButton, VariantDeleteButton } from '@/components/products/delete-buttons';
import { SearchFilterBar } from '@/components/filters/search-filter-bar';

async function getProducts(params: {
  search?: string;
  status?: string;
  sort?: string;
}) {
  const { search = '', status = 'all', sort = 'name_asc' } = params;

  // Build where clause
  const where: any = {};
  
  // Search across product name, SKU, and variant names
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { sku: { contains: search, mode: 'insensitive' as const } },
      { 
        description: { contains: search, mode: 'insensitive' as const } 
      },
      { 
        variants: { 
          some: { 
            name: { contains: search, mode: 'insensitive' as const } 
          } 
        } 
      },
    ];
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
    case 'newest':
      orderBy.push({ createdAt: 'desc' });
      break;
    case 'oldest':
      orderBy.push({ createdAt: 'asc' });
      break;
    default:
      orderBy.push({ name: 'asc' });
  }

  const products = await db.product.findMany({
    where,
    include: {
      variants: status === 'all' 
        ? true 
        : {
            where: {
              isActive: status === 'active' ? true : false
            }
          },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy,
  });

  return products.map((product: typeof products[number]) => ({
    ...product,
    variants: product.variants.map((v: typeof product.variants[number]) => ({
      ...v,
      price: Number(v.price),
      cost: Number(v.cost),
    })),
  }));
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    search?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const status = params.status || 'all';
  const sort = params.sort || 'name_asc';

  const products = await getProducts({ search, status, sort });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <ProductDialog mode="create" />
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchPlaceholder="Search products by name, SKU, or variant..."
        filters={[
          {
            key: 'status',
            label: 'Variant Status',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All Variants' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ],
          },
        ]}
        sortOptions={[
          { value: 'name_asc', label: 'Name (A-Z)' },
          { value: 'name_desc', label: 'Name (Z-A)' },
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
        ]}
        defaultSort="name_asc"
      />

      {/* Products Cards */}
      <div className="space-y-6">
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {search 
                  ? `No products found matching "${search}"` 
                  : 'Belum ada produk tersedia. Buat produk pertama!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          products.map((product: typeof products[number]) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      SKU: {product.sku} • {product.variants.length} varian
                    </p>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <ProductDialog 
                      mode="edit" 
                      product={{
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        sku: product.sku,
                      }} 
                    />
                    <ProductDeleteButton productId={product.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {product.variants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {status === 'all' 
                        ? 'Belum ada varian tersedia' 
                        : `No ${status} variants found`}
                    </p>
                    <VariantDialog mode="create" productId={product.id} />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Varian</h4>
                      <VariantDialog mode="create" productId={product.id} />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Harga</TableHead>
                          {/* <TableHead>Cost</TableHead> */}
                          <TableHead>Stok</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className='text-xs'>
                        {product.variants.map((variant: typeof product.variants[number]) => (
                          <TableRow key={variant.id}>
                            <TableCell>{variant.sku}</TableCell>
                            <TableCell className="font-medium truncate">{variant.name}</TableCell>
                            <TableCell>{formatCurrency(variant.price)}</TableCell>
                            {/* <TableCell>{formatCurrency(variant.cost)}</TableCell> */}
                            <TableCell>
                              <span className={variant.stock <= variant.lowStock ? 'text-red-600 font-medium' : ''}>
                                {variant.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                variant.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {variant.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <VariantDialog 
                                  mode="edit" 
                                  variant={{
                                    id: variant.id,
                                    name: variant.name,
                                    sku: variant.sku,
                                    price: variant.price,
                                    cost: variant.cost,
                                    stock: variant.stock,
                                    lowStock: variant.lowStock,
                                    points: variant.points,
                                  }} 
                                />
                                <VariantDeleteButton variantId={variant.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}