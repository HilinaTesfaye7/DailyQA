import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.name || !data.projectId) {
      return NextResponse.json({ error: 'Name and projectId are required' }, { status: 400 });
    }

    const subProject = await prisma.subProject.create({
      data: {
        name: data.name,
        projectId: data.projectId,
      },
    });

    return NextResponse.json({ success: true, subProject });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
