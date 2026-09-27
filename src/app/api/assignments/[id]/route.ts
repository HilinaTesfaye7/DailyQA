import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const url = new URL(request.url);
    const testerId = url.searchParams.get('testerId');

    await prisma.assignment.delete({
      where: { id }
    });

    // Check if tester has any remaining assignments
    if (testerId) {
      const remaining = await prisma.assignment.count({
        where: { testerId }
      });
      if (remaining === 0) {
        await prisma.tester.update({
          where: { id: testerId },
          data: { status: 'PENDING_ASSIGNMENT' }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
