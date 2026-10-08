import { NextResponse } from 'next/server';
import { assignTester } from '@/lib/assignments';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.testerId || !data.projectId) {
      return NextResponse.json({ error: 'Tester and Project are required' }, { status: 400 });
    }

    const count = await assignTester({
      testerId: data.testerId,
      projectId: data.projectId,
      moduleIds: Array.isArray(data.moduleIds) ? data.moduleIds : [],
    });

    if (count === null) {
      return NextResponse.json({ error: 'Invalid tester or project' }, { status: 400 });
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
