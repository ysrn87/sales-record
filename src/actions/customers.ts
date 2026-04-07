'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Helper function for phone normalization
const normalizePhone = (phone: string): string => {
  return phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
};

// Create non-member customer
export async function createNonMemberCustomerAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      return { success: false, error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const rawPhone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    // Normalize phone
    const phone = normalizePhone(rawPhone);

    // Validation
    if (!name || !phone || !address) {
      return { success: false, error: 'Name, phone, and address are required' };
    }

    if (phone.length < 10 || phone.length > 15) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    // Check for duplicate phone in both User and Customer tables
    const [existingUser, existingCustomer] = await Promise.all([
      db.user.findFirst({ where: { phone } }),
      db.customer.findFirst({ where: { phone } })
    ]);

    if (existingUser) {
      return { success: false, error: 'Phone number already registered as member' };
    }

    if (existingCustomer) {
      return { success: false, error: 'Phone number already registered as customer' };
    }

    // Create non-member customer
    const customer = await db.customer.create({
      data: {
        name,
        phone,
        address,
      },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/manager/sales');
    return { success: true, data: customer };
  } catch (error) {
    console.error('Create non-member customer error:', error);
    return { success: false, error: 'Failed to create customer' };
  }
}

// Get all non-member customers
export async function getAllNonMemberCustomers() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      throw new Error('Unauthorized');
    }

    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
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
    });

    return customers;
  } catch (error) {
    console.error('Get non-member customers error:', error);
    throw error;
  }
}

// Get customer purchase history (works for both member and non-member)
export async function getCustomerPurchaseHistory(customerId: string, isNonMember: boolean = false) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'MANAGER')) {
      throw new Error('Unauthorized');
    }

    const sales = await db.sale.findMany({
      where: isNonMember 
        ? { nonMemberCustomerId: customerId }
        : { customerId: customerId },
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
        cashier: {
          select: {
            name: true,
          },
        },
      },
    });

    return sales.map((sale) => {
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
        items: items.map((item) => {
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
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    throw error;
  }
}

// Upgrade non-member to member
export async function upgradeToMemberAction(customerId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    const password = formData.get('password') as string;
    const email = formData.get('email') as string;
    const birthday = formData.get('birthday') as string;
    const photoUrl = formData.get('photoUrl') as string;
    const name = (formData.get('name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();
    const address = (formData.get('address') as string)?.trim();

    // Validation
    if (!password || password.length < 6) {
      return { success: false, error: 'Password is required (min. 6 characters)' };
    }
    if (!name) {
      return { success: false, error: 'Name is required' };
    }
    if (!phone) {
      return { success: false, error: 'Phone number is required' };
    }
    if (!address) {
      return { success: false, error: 'Address is required' };
    }

    // Get non-member customer
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: true,
      },
    });

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    // Check if phone already exists in User table
    const existingUser = await db.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      return { success: false, error: 'Phone number already registered as member' };
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.user.findFirst({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingEmail) {
        return { success: false, error: 'Email already registered' };
      }
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction to ensure data integrity
    await db.$transaction(async (tx) => {
      // Create new member user
      const newUser = await tx.user.create({
        data: {
          name,
          phone,
          address,
          email: email ? email.trim().toLowerCase() : null,
          birthday: birthday ? new Date(birthday) : null,
          photoUrl: photoUrl || null,
          password: hashedPassword,
          role: 'MEMBER',
          points: 0,
        },
      });

      // Transfer all sales from non-member to member
      if (customer.sales.length > 0) {
        await tx.sale.updateMany({
          where: { nonMemberCustomerId: customerId },
          data: {
            customerId: newUser.id,
            nonMemberCustomerId: null,
          },
        });
      }

      // Delete the non-member customer record
      await tx.customer.delete({
        where: { id: customerId },
      });
    });

    revalidatePath('/admin/customers');
    revalidatePath('/manager/customers');
    return { success: true };
  } catch (error) {
    console.error('Upgrade to member error:', error);
    return { success: false, error: 'Failed to upgrade customer to member' };
  }
}

// Update non-member customer
export async function updateNonMemberCustomerAction(customerId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    const name = (formData.get('name') as string)?.trim();
    const rawPhone = formData.get('phone') as string;
    const address = (formData.get('address') as string)?.trim();

    const phone = normalizePhone(rawPhone);

    if (!name || !phone || !address) {
      return { success: false, error: 'Name, phone, and address are required' };
    }

    if (phone.length < 10 || phone.length > 15) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    // Check for duplicate phone, excluding this customer
    const [existingUser, existingCustomer] = await Promise.all([
      db.user.findFirst({ where: { phone } }),
      db.customer.findFirst({ where: { phone, NOT: { id: customerId } } }),
    ]);

    if (existingUser) {
      return { success: false, error: 'Phone number already registered as member' };
    }
    if (existingCustomer) {
      return { success: false, error: 'Phone number already used by another customer' };
    }

    await db.customer.update({
      where: { id: customerId },
      data: { name, phone, address },
    });

    revalidatePath('/admin/customers');
    revalidatePath('/manager/customers');
    return { success: true };
  } catch (error) {
    console.error('Update non-member customer error:', error);
    return { success: false, error: 'Failed to update customer' };
  }
}

// Delete non-member customer
export async function deleteNonMemberCustomerAction(customerId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMINISTRATOR') {
      return { success: false, error: 'Unauthorized - Admin access required' };
    }

    // Check if customer has sales
    const salesCount = await db.sale.count({
      where: { nonMemberCustomerId: customerId },
    });

    if (salesCount > 0) {
      return { success: false, error: 'Cannot delete customer with existing sales' };
    }

    await db.customer.delete({
      where: { id: customerId },
    });

    revalidatePath('/admin/customers');
    revalidatePath('/manager/customers');
    return { success: true };
  } catch (error) {
    console.error('Delete non-member customer error:', error);
    return { success: false, error: 'Failed to delete customer' };
  }
}