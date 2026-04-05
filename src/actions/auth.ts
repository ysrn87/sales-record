'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

// 🔧 Helper Functions for Data Normalization
const normalizePhone = (phone: string): string => {
  // Remove all spaces and keep only digits and +
  return phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
};

const normalizeEmail = (email: string | null | undefined): string | null => {
  if (!email || email.trim() === '') return null;
  // Trim whitespace and convert to lowercase for case-insensitive comparison
  return email.trim().toLowerCase();
};

export async function loginAction(formData: FormData) {
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid credentials' };
        default:
          return { success: false, error: 'Something went wrong' };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}

export async function registerMemberAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const rawPhone = formData.get('phone') as string;
    const rawEmail = formData.get('email') as string;
    const address = formData.get('address') as string;
    const password = formData.get('password') as string;
    const birthday = formData.get('birthday') as string;

    // 🔧 Normalize phone and email
    const phone = normalizePhone(rawPhone);
    const email = normalizeEmail(rawEmail);

    // Validation
    if (!name || !phone || !password) {
      return { success: false, error: 'Name, phone number, and password are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Validate phone number format
    if (phone.length < 10 || phone.length > 15) {
      return { success: false, error: 'Please enter a valid phone number' };
    }

    // Import db and bcrypt
    const { db } = await import('@/lib/db');
    const bcrypt = await import('bcryptjs');

    // ✅ Check for duplicate phone (now checks against normalized phone numbers)
    const existingPhone = await db.user.findFirst({
      where: { phone },
    });

    if (existingPhone) {
      return { success: false, error: 'Phone number already registered' };
    }

    // ✅ Check for duplicate email (case-insensitive, if provided)
    if (email) {
      const existingEmail = await db.user.findFirst({
        where: { email },
      });

      if (existingEmail) {
        return { success: false, error: 'Email already registered' };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new member with normalized data
    await db.user.create({
      data: {
        name,
        phone,        // ✅ Saved without spaces: "081234567890"
        email,        // ✅ Saved trimmed & lowercase: "john@example.com"
        address,
        password: hashedPassword,
        birthday: birthday ? new Date(birthday) : null,
        role: 'MEMBER',
        points: 0,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Failed to create account. Please try again.' };
  }
}
