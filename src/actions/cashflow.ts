'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createCashflowAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const type = formData.get('type') as 'INCOME' | 'EXPENSE';
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const description = formData.get('description') as string || '';
    const date = new Date(formData.get('date') as string);

    if (!type || !amount || !category || !date) {
      return { success: false, error: 'Missing required fields' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    await db.cashflow.create({
      data: {
        type,
        amount,
        category,
        description,
        date,
        createdById: session.user.id,
      },
    });

    revalidatePath('/admin/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Cashflow creation error:', error);
    return { success: false, error: 'Failed to record transaction' };
  }
}

export async function updateCashflowAction(id: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const type = formData.get('type') as 'INCOME' | 'EXPENSE';
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const description = formData.get('description') as string || '';
    const date = new Date(formData.get('date') as string);

    if (!type || !amount || !category || !date) {
      return { success: false, error: 'Missing required fields' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    await db.cashflow.update({
      where: { id },
      data: {
        type,
        amount,
        category,
        description,
        date,
      },
    });

    revalidatePath('/admin/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Cashflow update error:', error);
    return { success: false, error: 'Failed to update transaction' };
  }
}

export async function deleteCashflowAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.cashflow.delete({
      where: { id },
    });

    revalidatePath('/admin/cashflow');
    return { success: true };
  } catch (error) {
    console.error('Cashflow delete error:', error);
    return { success: false, error: 'Failed to delete transaction' };
  }
}