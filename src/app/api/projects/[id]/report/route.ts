import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import {
  buildReportCsv,
  buildReportHtml,
  getEthiopiaToday,
  getReportRange,
  isReportPeriod,
  isValidDateString,
  reportFileName,
} from '@/lib/report';

export const dynamic = 'force-dynamic';

// GET /api/projects/:id/report?period=daily|weekly|monthly&date=YYYY-MM-DD&format=csv|html
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = (await params).id;
  const url = new URL(request.url);
  const periodParam = url.searchParams.get('period');
  const dateParam = url.searchParams.get('date');
  const format = url.searchParams.get('format') === 'html' ? 'html' : 'csv';

  const period = isReportPeriod(periodParam) ? periodParam : 'daily';
  const anchor = isValidDateString(dateParam) ? dateParam : getEthiopiaToday();
  const range = getReportRange(period, anchor);

  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const checkIns = await prisma.checkIn.findMany({
    where: { projectId: id, ethiopiaDate: { gte: range.start, lte: range.end } },
    include: { tester: { select: { fullName: true } }, module: { select: { name: true } }, blockers: { select: { status: true } } },
    orderBy: [{ ethiopiaDate: 'asc' }, { date: 'asc' }],
  });

  const opts = { projectName: project.name, period, range, checkIns, generatedAt: new Date() };
  const fileName = reportFileName(project.name, period, range);

  if (format === 'html') {
    return new NextResponse(buildReportHtml(opts), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${fileName}.html"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return new NextResponse(buildReportCsv(opts), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
