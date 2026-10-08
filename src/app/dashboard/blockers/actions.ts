'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';

export async function resolveBlocker(blockerId: string, formData?: FormData) {
  await requireSession();
  try {
    await prisma.blocker.update({
      where: { id: blockerId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });
    
    revalidatePath('/dashboard/blockers');
  } catch (error) {
    console.error('Failed to resolve blocker:', error);
    throw new Error('Failed to resolve blocker');
  }
}
