const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a Project and Module
  const project = await prisma.project.create({
    data: {
      name: 'Seed Project Alpha',
      status: 'ACTIVE',
      modules: {
        create: { name: 'Authentication Module' }
      }
    },
    include: { modules: true }
  });

  const moduleId = project.modules[0].id;

  // Create Pending Testers
  await prisma.tester.create({
    data: {
      fullName: 'Alice Pending',
      telegramId: '111111',
      status: 'PENDING_ASSIGNMENT'
    }
  });

  await prisma.tester.create({
    data: {
      fullName: 'Bob Pending',
      telegramId: '222222',
      status: 'PENDING_ASSIGNMENT'
    }
  });

  // Create Active Tester 1 (Assigned, No check-ins)
  await prisma.tester.create({
    data: {
      fullName: 'Charlie Active',
      telegramId: '333333',
      status: 'ACTIVE',
      assignments: {
        create: {
          projectId: project.id,
          moduleId: moduleId
        }
      }
    }
  });

  // Create Active Tester 2 (Assigned, With check-ins)
  await prisma.tester.create({
    data: {
      fullName: 'David Active',
      telegramId: '444444',
      status: 'ACTIVE',
      assignments: {
        create: {
          projectId: project.id
        }
      },
      checkIns: {
        create: {
          projectId: project.id,
          moduleId: moduleId,
          ethiopiaDate: '2026-09-21',
          workCompleted: 'Tested login flow',
          nextPlan: 'Test logout',
          achievement: 'Found 2 bugs',
          testsExecuted: 5,
          testsPassed: 3,
          testsFailed: 2
        }
      }
    }
  });

  console.log('Seed data inserted successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
