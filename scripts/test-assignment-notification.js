

const API_URL = 'http://localhost:3000/api/assignments';

async function runTest() {
  console.log('Fetching active projects and testers from DB directly to construct valid IDs...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  // Find a pending tester
  const tester = await prisma.tester.findFirst({
    where: { status: 'PENDING_ASSIGNMENT' }
  });

  if (!tester) {
    console.log('No pending tester found for test.');
    await prisma.$disconnect();
    return;
  }

  // Find a project with modules
  const project = await prisma.project.findFirst({
    where: { status: 'ACTIVE' },
    include: { modules: true }
  });

  if (!project || project.modules.length === 0) {
    console.log('No suitable project/module found for test.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$disconnect();

  const payload = {
    testerId: tester.id,
    projectId: project.id,
    moduleIds: [project.modules[0].id]
  };

  console.log(`\nSimulating QA Lead Assigning ${tester.fullName} to ${project.name} (${project.modules[0].name})...`);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('API Response:', data);
  } catch (err) {
    console.error('Failed to hit API:', err.message);
  }
}

runTest();
