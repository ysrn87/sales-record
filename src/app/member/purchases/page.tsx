import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getPointsConversionRate } from '@/actions/settings';
import { PurchaseHistoryView } from '@/components/member/purchase-history-view';

async function getPurchaseHistory(userId: string) {
  return db.sale.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
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
  });
}

export default async function MemberPurchasesPage() {
  const session = await auth();
  if (!session) return null;

  const [purchases, conversionRate] = await Promise.all([
    getPurchaseHistory(session.user.id),
    getPointsConversionRate(),
  ]);

  // Serialize Decimal fields to numbers for client component
  const serializedPurchases = purchases.map((purchase: typeof purchases[number]) => ({
    id: purchase.id,
    saleNumber: purchase.saleNumber,
    customerId: purchase.customerId,
    cashierId: purchase.cashierId,
    paymentMethod: purchase.paymentMethod,
    paymentStatus: purchase.paymentStatus,
    notes: purchase.notes,
    pointsEarned: purchase.pointsEarned,
    pointsRedeemed: purchase.pointsRedeemed,
    createdAt: purchase.createdAt,
    subtotal: Number(purchase.subtotal),
    discount: Number(purchase.discount),
    tax: Number(purchase.tax),
    total: Number(purchase.total),
    items: purchase.items.map((item: typeof purchase.items[number]) => ({
      id: item.id,
      saleId: item.saleId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      variant: {
        id: item.variant.id,
        productId: item.variant.productId,
        name: item.variant.name,
        sku: item.variant.sku,
        stock: item.variant.stock,
        lowStock: item.variant.lowStock,
        isActive: item.variant.isActive,
        points: item.variant.points,
        createdAt: item.variant.createdAt,
        updatedAt: item.variant.updatedAt,
        price: Number(item.variant.price),
        cost: Number(item.variant.cost),
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          sku: item.variant.product.sku,
          description: item.variant.product.description,
          createdById: item.variant.product.createdById,
          updatedById: item.variant.product.updatedById,
          createdAt: item.variant.product.createdAt,
          updatedAt: item.variant.product.updatedAt,
        },
      },
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Riwayat Pembelian</h1>
        <p className="text-gray-600">Lihat semua pembelian terdahulu</p>
      </div>

      <PurchaseHistoryView 
        purchases={serializedPurchases} 
        conversionRate={conversionRate}
      />
    </div>
  );
}