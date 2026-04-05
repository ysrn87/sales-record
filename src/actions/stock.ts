'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function adjustStockAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const variantId = formData.get('variantId') as string;
    const type = formData.get('type') as 'IN' | 'OUT' | 'ADJUSTMENT';
    const quantity = parseInt(formData.get('quantity') as string);
    const notes = formData.get('reason') as string || undefined;

    if (!variantId || !type || !quantity) {
      return { success: false, error: 'Missing required fields' };
    }

    // Get current variant
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return { success: false, error: 'Product variant not found' };
    }

    // Calculate new stock
    let newStock = variant.stock;
    if (type === 'IN') {
      newStock += quantity;
    } else if (type === 'OUT') {
      newStock -= quantity;
      if (newStock < 0) {
        return { success: false, error: 'Insufficient stock' };
      }
    } else if (type === 'ADJUSTMENT') {
      newStock = quantity;
    }

    // Update stock and create movement record with cashflow
    await db.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          type,
          quantity,
          notes,
        },
      });

      // Create cashflow entry for stock IN (purchasing inventory)
      if (type === 'IN' && quantity > 0) {
        const totalCost = Number(variant.cost) * quantity;
        
        await tx.cashflow.create({
          data: {
            type: 'EXPENSE',
            category: 'Pembelian Inventaris',
            amount: totalCost,
            description: `Pembelian ${quantity} unit ${variant.product.name} - ${variant.name}${notes ? ` (${notes})` : ''}`,
            date: new Date(),
            createdById: session.user.id,
          },
        });
      }
    });

    revalidatePath('/admin/stock');
    revalidatePath('/manager/stock');
    revalidatePath('/admin/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return { success: false, error: 'Gagal atur stok' };
  }
}
