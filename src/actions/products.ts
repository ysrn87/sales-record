'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createProductAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const sku = formData.get('sku') as string;

    if (!name || !sku) {
      return { success: false, error: 'Name and SKU are required' };
    }

    // Check if SKU already exists
    const existingSKU = await db.product.findUnique({
      where: { sku },
    });

    if (existingSKU) {
      return { success: false, error: 'SKU already exists' };
    }

    await db.product.create({
      data: {
        name,
        description: description || null,
        sku,
        createdById: session.user.id,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/manager/products');
    return { success: true };
  } catch (error) {
    console.error('Create product error:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProductAction(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const sku = formData.get('sku') as string;

    if (!name || !sku) {
      return { success: false, error: 'Name and SKU are required' };
    }

    // Check if SKU exists on different product
    const existingSKU = await db.product.findFirst({
      where: { 
        sku,
        id: { not: id }
      },
    });

    if (existingSKU) {
      return { success: false, error: 'SKU already exists' };
    }

    await db.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        sku,
        updatedById: session.user.id,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/manager/products');
    return { success: true };
  } catch (error) {
    console.error('Update product error:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    await db.product.delete({
      where: { id },
    });

    revalidatePath('/admin/products');
    revalidatePath('/manager/products');
    return { success: true };
  } catch (error) {
    console.error('Delete product error:', error);
    return { success: false, error: 'Failed to delete product. Make sure it has no variants.' };
  }
}

export async function createVariantAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const productId = formData.get('productId') as string;
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const price = parseFloat(formData.get('price') as string);
    const cost = parseFloat(formData.get('cost') as string);
    const stock = parseInt(formData.get('stock') as string);
    const lowStock = parseInt(formData.get('lowStock') as string);
    const points = parseInt(formData.get('points') as string) || 0;

    if (!productId || !name || !sku || isNaN(price) || isNaN(cost) || isNaN(stock) || isNaN(lowStock)) {
      return { success: false, error: 'All fields are required' };
    }

    // Check if SKU already exists
    const existingSKU = await db.productVariant.findUnique({
      where: { sku },
    });

    if (existingSKU) {
      return { success: false, error: 'Variant SKU already exists' };
    }

    const variant = await db.productVariant.create({
      data: {
        productId,
        name,
        sku,
        price,
        cost,
        stock,
        lowStock,
        points,
      },
    });

    // Create stock movement and cashflow entry
    if (stock > 0) {
      await db.stockMovement.create({
        data: {
          variantId: variant.id,
          quantity: stock,
          type: 'IN',
          notes: 'Stok Awal',
        },
      });

      // Record cashflow for initial stock purchase
      const totalCost = cost * stock;
      await db.cashflow.create({
        data: {
          type: 'EXPENSE',
          category: 'Pembelian Inventaris',
          amount: totalCost,
          description: `Penambahan Stok Awal: ${name} (${sku}) - ${stock} units`,
          date: new Date(),
          createdById: session.user.id,
        },
      });
    }

    revalidatePath('/admin/products');
    revalidatePath('/manager/products');
    revalidatePath('/admin/stock');
    revalidatePath('/manager/stock');
    revalidatePath('/admin/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Create variant error:', error);
    return { success: false, error: 'Failed to create variant' };
  }
}

export async function updateVariantAction(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const price = parseFloat(formData.get('price') as string);
    const cost = parseFloat(formData.get('cost') as string);
    const lowStock = parseInt(formData.get('lowStock') as string);
    const points = parseInt(formData.get('points') as string) || 0;

    if (!name || !sku || isNaN(price) || isNaN(cost) || isNaN(lowStock)) {
      return { success: false, error: 'All fields are required' };
    }

    // Check if SKU exists on different variant
    const existingSKU = await db.productVariant.findFirst({
      where: { 
        sku,
        id: { not: id }
      },
    });

    if (existingSKU) {
      return { success: false, error: 'Variant SKU already exists' };
    }

    await db.productVariant.update({
      where: { id },
      data: {
        name,
        sku,
        price,
        cost,
        lowStock,
        points,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/manager/products');
    return { success: true };
  } catch (error) {
    console.error('Update variant error:', error);
    return { success: false, error: 'Failed to update variant' };
  }
}

export async function deleteVariantAction(id: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    await db.productVariant.delete({
      where: { id },
    });

    revalidatePath('/admin/products');
    revalidatePath('/manager/products');
    revalidatePath('/admin/stock');
    revalidatePath('/manager/stock');
    return { success: true };
  } catch (error) {
    console.error('Delete variant error:', error);
    return { success: false, error: 'Failed to delete variant. Make sure it has no sales.' };
  }
}

export async function toggleProductActiveAction(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.product.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/admin/inventory/products');
    revalidatePath('/manager/inventory/products');
    return { success: true };
  } catch (error) {
    console.error('Toggle product active error:', error);
    return { success: false, error: 'Failed to update product status' };
  }
}

export async function toggleVariantActiveAction(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.productVariant.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/admin/inventory/products');
    revalidatePath('/manager/inventory/products');
    return { success: true };
  } catch (error) {
    console.error('Toggle variant active error:', error);
    return { success: false, error: 'Failed to update variant status' };
  }
}