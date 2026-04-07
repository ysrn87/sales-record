'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import bcrypt from 'bcryptjs';

// Get a setting value
export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.settings.findUnique({
    where: { key },
  });
  
  return setting?.value || null;
}

// Get points conversion rate
export async function getPointsConversionRate(): Promise<number> {
  const setting = await getSetting('pointsConversionRate');
  return setting ? parseInt(setting) : DEFAULT_SETTINGS.pointsConversionRate;
}

// Get all settings
export async function getAllSettings() {
  const settings = await db.settings.findMany({
    orderBy: { key: 'asc' },
  });
  
  // Create map of settings
  const settingsMap: Record<string, string> = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });
  
  // Return with defaults for missing values
  return {
    pointsConversionRate: settingsMap.pointsConversionRate || DEFAULT_SETTINGS.pointsConversionRate.toString(),
    minPointsForRedemption: settingsMap.minPointsForRedemption || DEFAULT_SETTINGS.minPointsForRedemption.toString(),
    maxPointsPerTransaction: settingsMap.maxPointsPerTransaction || DEFAULT_SETTINGS.maxPointsPerTransaction.toString(),
  };
}

// Update a setting (Admin only)
export async function updateSetting(key: string, value: string, description?: string) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized - Admin access required');
  }

  await db.settings.upsert({
    where: { key },
    update: { 
      value,
      description: description || undefined,
    },
    create: { 
      key, 
      value,
      description: description || undefined,
    },
  });

  revalidatePath('/admin/settings');
  revalidatePath('/admin/sales');
  revalidatePath('/manager/sales');
}

// Update points conversion rate
export async function updatePointsConversionRate(rate: number) {
  if (rate < 100 || rate > 10000) {
    throw new Error('Conversion rate must be between 100 and 10,000');
  }

  await updateSetting(
    'pointsConversionRate', 
    rate.toString(),
    'Points to Rupiah conversion rate (1 point = X Rupiah)'
  );
}

// Update min points for redemption
export async function updateMinPointsForRedemption(minPoints: number) {
  if (minPoints < 1 || minPoints > 1000) {
    throw new Error('Minimum points must be between 1 and 1,000');
  }

  await updateSetting(
    'minPointsForRedemption',
    minPoints.toString(),
    'Minimum points required to redeem'
  );
}

// Update max points per transaction
export async function updateMaxPointsPerTransaction(maxPoints: number) {
  if (maxPoints < 10) {
    throw new Error('Maximum points must be at least 10');
  }

  await updateSetting(
    'maxPointsPerTransaction',
    maxPoints.toString(),
    'Maximum points that can be redeemed in a single transaction'
  );
}

// Initialize default settings
export async function initializeSettings() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized');
  }

  const defaults = [
    { 
      key: 'pointsConversionRate', 
      value: DEFAULT_SETTINGS.pointsConversionRate.toString(),
      description: 'Points to Rupiah conversion rate (1 point = X Rupiah)'
    },
    { 
      key: 'minPointsForRedemption', 
      value: DEFAULT_SETTINGS.minPointsForRedemption.toString(),
      description: 'Minimum points required to redeem'
    },
    { 
      key: 'maxPointsPerTransaction', 
      value: DEFAULT_SETTINGS.maxPointsPerTransaction.toString(),
      description: 'Maximum points that can be redeemed in a single transaction'
    },
  ];

  for (const setting of defaults) {
    await db.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  revalidatePath('/admin/settings');
}

// Get current admin profile
export async function getAdminProfile() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized - Admin access required');
  }

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  return admin;
}

// Update admin profile
export async function updateAdminProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized - Admin access required');
  }

  // Validate email if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check if email is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }
  }

  // Validate phone if provided
  if (data.phone) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(data.phone)) {
      throw new Error('Invalid phone format');
    }

    // Check if phone is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        phone: data.phone,
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      throw new Error('Phone number already in use');
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
    },
  });

  revalidatePath('/admin/settings');
}

// Update admin password
export async function updateAdminPassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized - Admin access required');
  }

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  revalidatePath('/admin/settings');
}
