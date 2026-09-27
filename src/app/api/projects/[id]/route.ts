import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const data = await request.json();

    if (!data.name || !data.status) {
      return NextResponse.json({ error: 'Project name and status are required' }, { status: 400 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        productOwner: data.productOwner || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        prdLink: data.prdLink || null,
        figmaLink: data.figmaLink || null,
        status: data.status,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
