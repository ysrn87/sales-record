import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting admin-only database seed...\n');

  // ============================================
  // CUSTOMIZE YOUR ADMIN CREDENTIALS HERE
  // ============================================
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = 'admin123';  // Change this!
  const ADMIN_NAME = 'Administrator';
  const ADMIN_PHONE = '+6281234567890';
  const ADMIN_ADDRESS = 'Jakarta, Indonesia';
  const ADMIN_BIRTHDAY = new Date('1990-01-01');
  // ============================================

  // Hash the password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  console.log('👤 Creating administrator user...');
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      address: ADMIN_ADDRESS,
      role: Role.ADMINISTRATOR,
      birthday: ADMIN_BIRTHDAY,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      address: ADMIN_ADDRESS,
      role: Role.ADMINISTRATOR,
      birthday: ADMIN_BIRTHDAY,
      points: 0,
    },
  });

  console.log('   ✓ Administrator created successfully');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Phone: ${admin.phone}`);

  // Create essential system settings
  console.log('\n⚙️  Creating system settings...');
  
  await prisma.settings.upsert({
    where: { key: 'pointsConversionRate' },
    update: {},
    create: {
      key: 'pointsConversionRate',
      value: '1000',
      description: 'Points to Rupiah conversion rate (1 point = X Rupiah)',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'minPointsForRedemption' },
    update: {},
    create: {
      key: 'minPointsForRedemption',
      value: '10',
      description: 'Minimum points required to redeem',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'maxPointsPerTransaction' },
    update: {},
    create: {
      key: 'maxPointsPerTransaction',
      value: '1000',
      description: 'Maximum points that can be redeemed in a single transaction',
    },
  });

  console.log('   ✓ Created 3 system settings');

  console.log('\n🎉 Admin-only seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   • 1 administrator user');
  console.log('   • 3 system settings');
  console.log('\n🔐 Login credentials:');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n⚠️  IMPORTANT: Change the default password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
