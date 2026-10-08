'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';

const PROJECT_STATUSES = ['ACTIVE', 'IN PROGRESS', 'READY FOR RELEASE', 'BLOCKED', 'COMPLETED', 'INACTIVE'];

export async function updateProjectStatus(projectId: string, newStatus: string) {
  await requireSession();
  if (!PROJECT_STATUSES.includes(newStatus)) throw new Error('Invalid status');

  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus }
  });
  revalidatePath('/dashboard', 'layout');
}

export async function deleteProject(projectId: string) {
  await requireSession();

  const checkIns = await prisma.checkIn.findMany({ where: { projectId }, select: { id: true } });
  const checkInIds = checkIns.map(c => c.id);
  const affectedTesters = await prisma.assignment.findMany({ where: { projectId }, select: { testerId: true }, distinct: ['testerId'] });

  await prisma.$transaction([
    prisma.testCase.deleteMany({ where: { projectId } }),
    prisma.blocker.deleteMany({ where: { checkInId: { in: checkInIds } } }),
    prisma.checkIn.deleteMany({ where: { projectId } }),
    prisma.assignment.deleteMany({ where: { projectId } }),
    prisma.module.deleteMany({ where: { projectId } }),
    prisma.subProject.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } })
  ]);

  // Testers left without any assignment go back to pending (same rule as removing an assignment).
  for (const { testerId } of affectedTesters) {
    const remaining = await prisma.assignment.count({ where: { testerId } });
    if (remaining === 0) {
      await prisma.tester.update({ where: { id: testerId }, data: { status: 'PENDING_ASSIGNMENT' } });
    }
  }

  revalidatePath('/dashboard', 'layout');
}
