import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { ensureAdminUser, seedCategories } from './seed-helpers.js';

const prisma = new PrismaClient();

async function main() {
  const seededCategories = await seedCategories(prisma);
  const adminUser = await ensureAdminUser(prisma);

  console.log(`Seeded ${seededCategories.length} categories.`);
  if (adminUser?.email) {
    console.log(`Preserved admin user ${adminUser.email}.`);
  }
}

main()
  .catch((error) => {
    console.error('Failed to seed categories.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
