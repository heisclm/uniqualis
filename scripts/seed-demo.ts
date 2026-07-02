import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for testing...');
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  // Create Faculty
  const faculty = await prisma.faculty.upsert({
    where: { id: 'fac-1' },
    update: {},
    create: {
      id: 'fac-1',
      name: 'Faculty of Engineering',
    },
  });

  // Create Department
  const department = await prisma.department.upsert({
    where: { id: 'dep-1' },
    update: {},
    create: {
      id: 'dep-1',
      name: 'Computer Science',
      facultyId: faculty.id,
    },
  });

  // Create Official (Dean/HOD)
  const official = await prisma.user.upsert({
    where: { email: 'official@uniqualis.edu' },
    update: {},
    create: {
      email: 'official@uniqualis.edu',
      passwordHash: defaultPassword,
      firstName: 'Dr. Jane',
      lastName: 'Doe (Dean)',
      role: 'OFFICIAL',
      officialFacultyId: faculty.id,
    },
  });

  // Create Lecturer
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@uniqualis.edu' },
    update: {},
    create: {
      email: 'lecturer@uniqualis.edu',
      passwordHash: defaultPassword,
      firstName: 'Prof. Alan',
      lastName: 'Turing',
      role: 'LECTURER',
      lecturerDepartmentId: department.id,
    },
  });

  console.log('✅ Demo seeding complete!');
  console.log(`- Demo Department ID (for Student signup): ${department.id}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
