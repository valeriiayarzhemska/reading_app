import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEV_USERS } from '../src/auth/dev-users.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // upsert = safe to run the seed any number of times
  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: {},
    });
  }

  console.log(`Seeded ${DEV_USERS.length} dev users`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
