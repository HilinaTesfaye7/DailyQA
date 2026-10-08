import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;

    // Check if tester exists
    const tester = await prisma.tester.findUnique({
      where: { id },
      include: { assignments: true, checkIns: true }
    });

    if (!tester) {
      return NextResponse.json({ error: 'Tester not found' }, { status: 404 });
    }

    // Since we don't have cascade delete configured on all relations in Prisma, 
    // we should delete related records first or use transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete Blockers associated with the tester's CheckIns
      const checkInIds = tester.checkIns.map(ci => ci.id);
      if (checkInIds.length > 0) {
        await tx.blocker.deleteMany({
          where: { checkInId: { in: checkInIds } }
        });
      }

      // 2. Delete CheckIns
      await tx.checkIn.deleteMany({
        where: { testerId: id }
      });

      // 3. Delete submitted Test Cases (FK to Tester)
      await tx.testCase.deleteMany({
        where: { testerId: id }
      });

      // 4. Delete Assignments
      await tx.assignment.deleteMany({
        where: { testerId: id }
      });

      // 5. Delete Tester
      await tx.tester.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
