'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// ─── Manager Types ────────────────────────────────────────────────────────────

export interface ManagerData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  createdAt: Date;
}

// ─── Get all managers ─────────────────────────────────────────────────────────

export async function getManagers(): Promise<ManagerData[]> {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized');
  }

  return db.user.findMany({
    where: { role: 'MANAGER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });
}

// ─── Create manager ───────────────────────────────────────────────────────────

export async function createManager(data: {
  name: string;
  phone: string;
  password: string;
  email?: string;
  address?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized');
  }

  if (!data.name.trim()) throw new Error('Nama wajib diisi');
  if (!data.phone.trim()) throw new Error('Nomor telepon wajib diisi');
  if (data.password.length < 6) throw new Error('Password minimal 6 karakter');

  const existingPhone = await db.user.findFirst({ where: { phone: data.phone } });
  if (existingPhone) throw new Error('Nomor telepon sudah digunakan');

  if (data.email) {
    const existingEmail = await db.user.findFirst({ where: { email: data.email } });
    if (existingEmail) throw new Error('Email sudah digunakan');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await db.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      password: hashedPassword,
      role: 'MANAGER',
      email: data.email || null,
      address: data.address || null,
    },
  });

  revalidatePath('/admin/settings/profile');
}

// ─── Update manager ───────────────────────────────────────────────────────────

export async function updateManager(
  managerId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    newPassword?: string;
  }
) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized');
  }

  if (!data.name.trim()) throw new Error('Nama wajib diisi');
  if (!data.phone.trim()) throw new Error('Nomor telepon wajib diisi');

  const existingPhone = await db.user.findFirst({
    where: { phone: data.phone, NOT: { id: managerId } },
  });
  if (existingPhone) throw new Error('Nomor telepon sudah digunakan');

  if (data.email) {
    const existingEmail = await db.user.findFirst({
      where: { email: data.email, NOT: { id: managerId } },
    });
    if (existingEmail) throw new Error('Email sudah digunakan');
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
  };

  if (data.newPassword) {
    if (data.newPassword.length < 6) throw new Error('Password minimal 6 karakter');
    updateData.password = await bcrypt.hash(data.newPassword, 10);
  }

  await db.user.update({
    where: { id: managerId },
    data: updateData,
  });

  revalidatePath('/admin/settings/profile');
}

// ─── Delete manager ───────────────────────────────────────────────────────────

export async function deleteManager(managerId: string) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMINISTRATOR') {
    throw new Error('Unauthorized');
  }

  const manager = await db.user.findUnique({ where: { id: managerId } });
  if (!manager || manager.role !== 'MANAGER') {
    throw new Error('Manager tidak ditemukan');
  }

  await db.user.delete({ where: { id: managerId } });

  revalidatePath('/admin/settings/profile');
}
