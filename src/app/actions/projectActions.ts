'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateProjectStatus(projectId: string, newStatus: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus }
  });
  revalidatePath('/dashboard/projects');
}

export async function deleteProject(projectId: string) {
  const checkIns = await prisma.checkIn.findMany({ where: { projectId }, select: { id: true } });
  const checkInIds = checkIns.map(c => c.id);

  await prisma.$transaction([
    prisma.testCase.deleteMany({ where: { projectId } }),
    prisma.blocker.deleteMany({ where: { checkInId: { in: checkInIds } } }),
    prisma.checkIn.deleteMany({ where: { projectId } }),
    prisma.assignment.deleteMany({ where: { projectId } }),
    prisma.module.deleteMany({ where: { projectId } }),
    prisma.subProject.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } })
  ]);
  
  revalidatePath('/dashboard/projects');
}
