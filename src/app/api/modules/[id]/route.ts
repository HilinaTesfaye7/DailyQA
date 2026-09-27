import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
      // Check if assignment already exists
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          testerId: data.testerId,
          projectId: data.projectId,
          moduleId: id
        }
      });
      if (!existingAssignment) {
        await prisma.assignment.create({
          data: {
            testerId: data.testerId,
            projectId: data.projectId,
            subProjectId: data.subProjectId || null,
            moduleId: id
          }
        });
        
        // Notify tester
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testerId: data.testerId,
            projectId: data.projectId,
            moduleIds: [id]
          })
        }).catch(e => console.error('Failed to trigger assignment notification', e));
      }
    }

    return NextResponse.json({ success: true, module: moduleData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
