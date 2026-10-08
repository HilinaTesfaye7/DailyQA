import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assignTester } from '@/lib/assignments';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.name || !data.projectId) {
      return NextResponse.json({ error: 'Name and projectId are required' }, { status: 400 });
    }

    const moduleData = await prisma.module.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        subProjectId: data.subProjectId || null,
      },
    });

    if (data.testerId) {
      await assignTester({
        testerId: data.testerId,
        projectId: data.projectId,
        moduleIds: [moduleData.id],
        subProjectId: data.subProjectId || null,
      });
    }

    return NextResponse.json({ success: true, module: moduleData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
