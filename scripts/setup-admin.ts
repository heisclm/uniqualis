/**
 * UniQualis - Admin Bootstrap Script
 * Run this script to create the initial system administrator.
 * 
 * Usage (with tsx):
 * npx tsx scripts/setup-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- UniQualis Admin Setup ---');
  
  const email = 'admin@uniqualis.edu';
  const password = 'SuperSecretAdminPassword123!';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    console.log('Admin account already exists.');
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Administrator',
      email,
      passwordHash,
      role: 'ADMIN',
    }
  });

  console.log('✅ Admin account created successfully!');
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log('Please change this password after your first login.');
}

main()
  .catch((e) => {
    console.error('Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
