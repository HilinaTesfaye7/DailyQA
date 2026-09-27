const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.assignment.findMany();
  
  const seen = new Set();
  let deletedCount = 0;

  for (const a of assignments) {
    const key = `${a.testerId}-${a.projectId}-${a.moduleId}`;
    if (seen.has(key)) {
      await prisma.assignment.delete({ where: { id: a.id } });
      deletedCount++;
    } else {
      seen.add(key);
    }
  }

  console.log(`Successfully deleted ${deletedCount} duplicate assignments.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
