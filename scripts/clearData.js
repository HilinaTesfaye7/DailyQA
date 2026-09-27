const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.blocker.deleteMany({});
  await prisma.checkIn.deleteMany({});
  
  // Reset all assignments' totalTests to 0 so the bot will ask again properly
  await prisma.assignment.updateMany({
    data: { totalTests: 0 }
  });

  console.log('Successfully cleared all CheckIns, Blockers, and reset Assignment totals.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
