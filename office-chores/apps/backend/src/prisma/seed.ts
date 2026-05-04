import { PrismaClient, Role, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin users
  const adminPassword = await bcrypt.hash('Admin@1234', 12);

  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@office.com' },
    update: {},
    create: {
      email: 'admin@office.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'manager@office.com' },
    update: {},
    create: {
      email: 'manager@office.com',
      name: 'Office Manager',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create sample team members
  const memberPassword = await bcrypt.hash('Member@1234', 12);
  const memberNames = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Martinez'];

  const members = await Promise.all(
    memberNames.map((name, i) =>
      prisma.user.upsert({
        where: { email: `${name.split(' ')[0].toLowerCase()}@office.com` },
        update: {},
        create: {
          email: `${name.split(' ')[0].toLowerCase()}@office.com`,
          name,
          passwordHash: memberPassword,
          role: Role.MEMBER,
        },
      })
    )
  );

  // Create sample chores
  const startDate = new Date();
  // Align to next Monday
  const daysUntilMonday = (8 - startDate.getDay()) % 7 || 7;
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  startDate.setHours(0, 0, 0, 0);

  const chores = [
    {
      title: 'Clean Kitchen',
      description: 'Wipe counters, clean microwave, empty dishwasher, and take out trash.',
      priority: Priority.HIGH,
    },
    {
      title: 'Restock Office Supplies',
      description: 'Check and restock printer paper, pens, sticky notes, and other supplies.',
      priority: Priority.MEDIUM,
    },
    {
      title: 'Water Plants',
      description: 'Water all office plants and check for dead leaves.',
      priority: Priority.LOW,
    },
    {
      title: 'Clean Conference Rooms',
      description: 'Wipe down tables, arrange chairs, clean whiteboards, and check AV equipment.',
      priority: Priority.HIGH,
    },
    {
      title: 'Empty Recycling Bins',
      description: 'Empty all recycling bins throughout the office and replace liners.',
      priority: Priority.MEDIUM,
    },
  ];

  for (const chore of chores) {
    const created = await prisma.chore.create({
      data: {
        ...chore,
        recurrenceRule: {
          create: {
            intervalWeeks: 2,
            dayOfWeek: 1, // Monday
            startDate,
          },
        },
      },
    });
    console.log(`Created chore: ${created.title}`);
  }

  console.log('✅ Seed complete!');
  console.log(`Admin login: admin@office.com / Admin@1234`);
  console.log(`Member login: alice@office.com / Member@1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
