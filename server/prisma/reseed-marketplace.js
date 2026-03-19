import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import {
  clearRuntimeMarketplaceData,
  ensureAdminUser,
  seedArabicMarketplace,
  seedCategories
} from './seed-helpers.js';

const prisma = new PrismaClient();

async function main() {
  const categories = await seedCategories(prisma);
  const adminUser = await ensureAdminUser(prisma);
  const cleanupSummary = await clearRuntimeMarketplaceData(prisma);
  const seedSummary = await seedArabicMarketplace(prisma);

  console.log(
    JSON.stringify(
      {
        preservedAdmin: adminUser?.email || process.env.SEED_ADMIN_EMAIL || null,
        preservedCategories: categories.length,
        cleanupSummary,
        seedSummary
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error('Failed to reseed marketplace data.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
