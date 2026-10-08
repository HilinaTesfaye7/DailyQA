import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assignTester } from '@/lib/assignments';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const data = await request.json();

    if (!data.name || !data.projectId) {
      return NextResponse.json({ error: 'Name and projectId are required' }, { status: 400 });
    }

    const moduleData = await prisma.module.update({
      where: { id },
      data: {
        name: data.name,
        subProjectId: data.subProjectId || null,
      },
    });

    if (data.testerId) {
      // Skips existing assignments; notifies the tester only for new ones.
      await assignTester({
        testerId: data.testerId,
        projectId: data.projectId,
        moduleIds: [id],
        subProjectId: data.subProjectId || null,
      });
    }

    return NextResponse.json({ success: true, module: moduleData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
