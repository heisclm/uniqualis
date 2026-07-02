import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- UniQualis Production Seeding ---');
  
  // 1. Root Admin Account
  const adminEmail = 'admin@uniqualis.edu';
  const adminPassword = 'SuperSecretAdminPassword123!';
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      }
    });
    console.log('✅ Root Admin account created.');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } else {
    console.log('Root Admin account already exists. Skipping.');
  }

  // 2. Default System Configuration
  const existingConfig = await prisma.systemSetting.findFirst();
  
  if (!existingConfig) {
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(now.getMonth() + 1); // default window is 1 month

    await prisma.systemSetting.create({
      data: {
        currentTermName: 'Fall 2026-2027',
        defaultDepartmentView: 'All Departments',
        evalWindowStartDate: now,
        evalWindowEndDate: endDate,
        autoClosePortal: true,
      }
    });
    console.log('✅ Default System Configuration seeded.');
  } else {
    console.log('System Configuration already exists. Skipping.');
  }

  console.log('--- Seeding Complete ---');
  console.log('Ready for the Admin to login and configure Faculties, Departments, and Staff.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
