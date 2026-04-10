'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { PaymentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { generateSaleNumber } from '@/lib/utils';
import { getAvailablePoints, getPointsExpiryDate } from '@/lib/points-utils';
import { getPointsConversionRate } from './settings';

interface SaleItemInput {
  variantId: string;
  quantity: number;
  price: number;
}

interface CreateSaleInput {
  items: SaleItemInput[];
  customerId: string | null;
  nonMemberCustomerId?: string | null; // For non-member customers
  paymentMethod: string;
  paymentStatus?: PaymentStatus;
  discount?: number;
  tax?: number;
  ongkir?: number;
  notes?: string;
  pointsRedeemed?: number; // Points used as discount
}

export async function createSaleAction(input: CreateSaleInput) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const { items, customerId, nonMemberCustomerId, paymentMethod, paymentStatus = 'PAID', discount = 0, tax = 0, ongkir = 0, notes, pointsRedeemed = 0 } = input;

    if (!items || items.length === 0) {
      return { success: false, error: 'No items in sale' };
    }

    if (notes && notes.length > 500) {
      return { success: false, error: 'Notes cannot exceed 500 characters' };
    }

    // Validate that only one customer type is selected
    if (customerId && nonMemberCustomerId) {
      return { success: false, error: 'Cannot assign both member and non-member customer to a sale' };
    }

    // Validate point redemption (only for members)
    if (pointsRedeemed > 0 && customerId) {
      const availablePoints = await getAvailablePoints(customerId);
      if (pointsRedeemed > availablePoints) {
        return { success: false, error: `Insufficient points. Available: ${availablePoints}` };
      }
    }

    // Points cannot be redeemed for non-member customers
    if (pointsRedeemed > 0 && nonMemberCustomerId) {
      return { success: false, error: 'Points redemption is only available for members' };
    }

    // Validate stock availability and calculate points
    let pointsEarned = 0;
    for (const item of items) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { select: { type: true } } },
      });

      if (!variant) {
        return { success: false, error: 'Product variant not found' };
      }

      if (variant.product.type !== 'PREORDER' && variant.stock < item.quantity) {
        return { success: false, error: `Insufficient stock for ${variant.name}` };
      }

      // Calculate points from variant points (only for members and if NOT redeeming points)
      if (customerId && pointsRedeemed === 0) {
        pointsEarned += variant.points * item.quantity;
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Get conversion rate and calculate point discount
    const conversionRate = await getPointsConversionRate();
    const pointDiscount = pointsRedeemed * conversionRate;

    // Validate total discount doesn't exceed subtotal
    const totalDiscount = discount + pointDiscount;
    if (totalDiscount > subtotal) {
      return {
        success: false,
        error: `Total discount (Rp ${totalDiscount.toLocaleString('id-ID')}) cannot exceed subtotal (Rp ${subtotal.toLocaleString('id-ID')})`
      };
    }

    // Calculate final total (subtract both regular discount AND point discount, add ongkir)
    const total = subtotal - discount - pointDiscount + tax + ongkir;

    // Prevent negative total
    if (total < 0) {
      return { success: false, error: 'Total payment cannot be negative. Please adjust discounts.' };
    }

    // Create sale with items in a transaction
    const sale = await db.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber: generateSaleNumber(),
          cashierId: session.user.id,
          customerId,
          nonMemberCustomerId,
          subtotal,
          discount,
          tax,
          ongkir,
          total,
          paymentMethod,
          paymentStatus: paymentStatus as PaymentStatus,
          notes,
          pointsEarned: customerId && pointsRedeemed === 0 ? pointsEarned : 0,
          pointsRedeemed: customerId ? pointsRedeemed : 0,
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Update stock and create movements (READY_STOCK only)
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { type: true } } },
        });

        if (variant?.product.type === 'PREORDER') continue;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: -item.quantity,
            type: 'OUT',
            notes: `PENJUALAN ${newSale.saleNumber}`,
          },
        });
      }

      // Handle points (only for members: either earn or redeem, not both)
      if (customerId) {
        if (pointsRedeemed > 0) {
          // Redeem points
          await tx.user.update({
            where: { id: customerId },
            data: { points: { decrement: pointsRedeemed } },
          });

          await tx.pointHistory.create({
            data: {
              userId: customerId,
              points: -pointsRedeemed,
              type: 'REDEEMED',
              description: `Punukaran poin ${newSale.saleNumber}`,
            },
          });
        } else if (pointsEarned > 0) {
          // Award points
          await tx.user.update({
            where: { id: customerId },
            data: { points: { increment: pointsEarned } },
          });

          await tx.pointHistory.create({
            data: {
              userId: customerId,
              points: pointsEarned,
              type: 'EARNED',
              description: `Poin pembelian ${newSale.saleNumber}`,
              expiresAt: getPointsExpiryDate(),
            },
          });
        }
      }

      // Create cashflow entry for the sale
      await tx.cashflow.create({
        data: {
          type: 'INCOME',
          category: 'Penjualan',
          amount: total,
          description: `Sale ${newSale.saleNumber}${customerId ? ` - ${await tx.user.findUnique({ where: { id: customerId }, select: { name: true } }).then(u => u?.name || 'Customer')}` : ' - Pelanggan umum'}`,
          date: new Date(),
          createdById: session.user.id,
        },
      });

      return newSale;
    });

    revalidatePath('/admin/sales');
    revalidatePath('/manager/sales');
    revalidatePath('/admin/stock');
    revalidatePath('/manager/stock');
    return { success: true, saleId: sale.id };
  } catch (error) {
    console.error('Create sale error:', error);
    return { success: false, error: 'Failed to create sale' };
  }
}

export async function getSales(limit: number = 50) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const sales = await db.sale.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
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
  });

  return sales;
}

export async function getSaleById(id: string) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      cashier: {
        select: {
          name: true,
          email: true,
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
  });

  return sale;
}

export async function updateSaleAction(id: string, input: CreateSaleInput) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const { items, customerId, paymentMethod, paymentStatus = 'PAID', discount = 0, tax = 0, ongkir = 0, notes, pointsRedeemed = 0 } = input;

    if (!items || items.length === 0) {
      return { success: false, error: 'No items in sale' };
    }

    if (notes && notes.length > 500) {
      return { success: false, error: 'Notes cannot exceed 500 characters' };
    }

    // Get original sale
    const originalSale = await db.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!originalSale) {
      return { success: false, error: 'Sale not found' };
    }

    // Validate stock availability for new quantities and calculate points
    let pointsEarned = 0;

    // Only calculate earned points if original sale didn't redeem points
    const shouldEarnPoints = Number(originalSale.pointsRedeemed) === 0;

    for (const item of items) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { select: { type: true } } },
      });

      if (!variant) {
        return { success: false, error: 'Product variant not found' };
      }

      // Calculate stock difference
      const originalItem = originalSale.items.find(i => i.variantId === item.variantId);
      const originalQty = originalItem?.quantity || 0;
      const qtyDifference = item.quantity - originalQty;

      if (variant.product.type !== 'PREORDER' && qtyDifference > 0 && variant.stock < qtyDifference) {
        return { success: false, error: `Insufficient stock for ${variant.name}` };
      }

      // Calculate points from variant points ONLY if not redeeming
      if (shouldEarnPoints) {
        pointsEarned += variant.points * item.quantity;
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const conversionRate = await getPointsConversionRate();
    const pointDiscount = pointsRedeemed * conversionRate;
    const total = subtotal - discount - pointDiscount + tax + ongkir;

    // Update sale in transaction
    await db.$transaction(async (tx) => {
      // Restore stock from original sale (READY_STOCK only)
      for (const item of originalSale.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { type: true } } },
        });

        if (variant?.product.type === 'PREORDER') continue;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            type: 'IN',
            notes: `Reversed from edited sale ${originalSale.saleNumber}`,
          },
        });
      }

      // Delete old sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // Update sale with new data
      await tx.sale.update({
        where: { id },
        data: {
          customerId,
          subtotal,
          discount,
          tax,
          ongkir,
          total,
          paymentMethod,
          paymentStatus: paymentStatus as PaymentStatus,
          notes,
          pointsEarned: customerId ? pointsEarned : 0,
          pointsRedeemed: pointsRedeemed,
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
      });

      // Deduct stock for new sale (READY_STOCK only)
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { type: true } } },
        });

        if (variant?.product.type === 'PREORDER') continue;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: -item.quantity,
            type: 'OUT',
            notes: `Updated sale ${originalSale.saleNumber}`,
          },
        });
      }

      // Update customer points
      if (originalSale.customerId && originalSale.customerId === customerId) {
        // Same customer, adjust points difference
        const pointsDiff = pointsEarned - Number(originalSale.pointsEarned);
        if (pointsDiff !== 0) {
          await tx.user.update({
            where: { id: customerId },
            data: { points: { increment: pointsDiff } },
          });

          await tx.pointHistory.create({
            data: {
              userId: customerId,
              points: pointsDiff,
              type: pointsDiff > 0 ? 'EARNED' : 'ADJUSTED',
              description: `Penyesuaian pembelian ${originalSale.saleNumber}`,
            },
          });
        }
      } else {
        // Different customer or changed from/to walk-in
        if (originalSale.customerId) {
          // Remove points from original customer
          await tx.user.update({
            where: { id: originalSale.customerId },
            data: { points: { decrement: Number(originalSale.pointsEarned) } },
          });

          await tx.pointHistory.create({
            data: {
              userId: originalSale.customerId,
              points: -Number(originalSale.pointsEarned),
              type: 'ADJUSTED',
              description: `Removed from edited sale ${originalSale.saleNumber}`,
            },
          });
        }

        if (customerId && pointsEarned > 0) {
          // Add points to new customer
          await tx.user.update({
            where: { id: customerId },
            data: { points: { increment: pointsEarned } },
          });

          await tx.pointHistory.create({
            data: {
              userId: customerId,
              points: pointsEarned,
              type: 'EARNED',
              description: `Didapat dari perubahan pembelian ${originalSale.saleNumber}`,
            },
          });
        }
      }

      // Update cashflow for the difference
      const cashflowDiff = total - Number(originalSale.total);
      if (cashflowDiff !== 0) {
        await tx.cashflow.create({
          data: {
            type: cashflowDiff > 0 ? 'INCOME' : 'EXPENSE',
            category: 'Penyesuaian Penjualan',
            amount: Math.abs(cashflowDiff),
            description: `Transaksi ${originalSale.saleNumber}`,
            date: new Date(),
            createdById: session.user.id,
          },
        });
      }
    });

    revalidatePath('/admin/sales');
    revalidatePath('/manager/sales');
    revalidatePath('/admin/stock');
    revalidatePath('/manager/stock');
    revalidatePath('/admin/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Update sale error:', error);
    return { success: false, error: 'Failed to update sale' };
  }
}
export async function deleteSaleAction(id: string) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const sale = await db.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return { success: false, error: 'Sale not found' };
    }

    await db.$transaction(async (tx) => {
      // 1. Restore stock for each item (READY_STOCK only)
      for (const item of sale.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { type: true } } },
        });

        if (variant?.product.type === 'PREORDER') continue;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            type: 'IN',
            notes: `Stok dikembalikan dari penghapusan ${sale.saleNumber}`,
          },
        });
      }

      // 2. Reverse customer points
      if (sale.customerId) {
        const pointsEarned = Number(sale.pointsEarned);
        const pointsRedeemed = Number(sale.pointsRedeemed);

        if (pointsEarned > 0) {
          // Customer earned points on this sale — deduct them back
          await tx.user.update({
            where: { id: sale.customerId },
            data: { points: { decrement: pointsEarned } },
          });

          await tx.pointHistory.create({
            data: {
              userId: sale.customerId,
              points: -pointsEarned,
              type: 'ADJUSTED',
              description: `Poin dikembalikan dari penghapusan ${sale.saleNumber}`,
            },
          });
        }

        if (pointsRedeemed > 0) {
          // Customer redeemed points on this sale — restore them back
          await tx.user.update({
            where: { id: sale.customerId },
            data: { points: { increment: pointsRedeemed } },
          });

          await tx.pointHistory.create({
            data: {
              userId: sale.customerId,
              points: pointsRedeemed,
              type: 'ADJUSTED',
              description: `Poin dikembalikan dari penghapusan ${sale.saleNumber}`,
            },
          });
        }
      }

      // 3. Create cashflow reversal entry (audit trail)
      await tx.cashflow.create({
        data: {
          type: 'EXPENSE',
          category: 'Penghapusan Penjualan',
          amount: Number(sale.total),
          description: `Penghapusan ${sale.saleNumber}`,
          date: new Date(),
          createdById: session.user.id,
        },
      });

      // 4. Delete the sale (SaleItems cascade-delete automatically)
      await tx.sale.delete({ where: { id } });
    });

    revalidatePath('/admin/sales-customers/sales');
    revalidatePath('/manager/sales-customers/sales');
    revalidatePath('/admin/inventory/stock');
    revalidatePath('/manager/inventory/stock');
    revalidatePath('/admin/finance/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Delete sale error:', error);
    return { success: false, error: 'Failed to delete sale' };
  }
}