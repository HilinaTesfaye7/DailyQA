import { prisma } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram';

/**
 * Assigns a tester to a project (optionally to specific modules), activates the
 * tester and sends them a Telegram notification asking for test cases.
 * Existing identical assignments are skipped. Returns the number created,
 * or null when the tester or project does not exist.
 */
export async function assignTester(opts: {
  testerId: string;
  projectId: string;
  moduleIds?: string[];
  subProjectId?: string | null;
}) {
  const { testerId, projectId, subProjectId = null } = opts;
  const moduleIds = (opts.moduleIds || []).filter(Boolean);

  const tester = await prisma.tester.findUnique({ where: { id: testerId } });
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!tester || !project) return null;

  const newModuleNames: string[] = [];
  let createdCount = 0;

  if (moduleIds.length > 0) {
    const modules = await prisma.module.findMany({ where: { id: { in: moduleIds }, projectId } });
    for (const mod of modules) {
      const existing = await prisma.assignment.findFirst({ where: { testerId, projectId, moduleId: mod.id } });
      if (existing) continue;
      await prisma.assignment.create({
        data: { testerId, projectId, moduleId: mod.id, subProjectId: subProjectId || mod.subProjectId },
      });
      newModuleNames.push(mod.name);
      createdCount++;
    }
  } else {
    const existing = await prisma.assignment.findFirst({ where: { testerId, projectId, moduleId: null } });
    if (!existing) {
      await prisma.assignment.create({ data: { testerId, projectId, subProjectId } });
      newModuleNames.push('Full Project');
      createdCount++;
    }
  }

  await prisma.tester.update({ where: { id: testerId }, data: { status: 'ACTIVE' } });

  if (createdCount > 0) {
    const msg = `🎉 You have been assigned to a project.\n\nProject: ${project.name}\n\nModule: ${newModuleNames.join(', ')}\n\nPRD:\n${project.prdLink || 'N/A'}\n\nFigma:\n${project.figmaLink || 'N/A'}\n\nWould you like to submit test cases for this assignment? (Reply with a link, description, or 'skip')`;
    await sendTelegramMessage(tester.telegramId, msg);
    await prisma.tester.update({
      where: { id: testerId },
      data: { botState: 'AWAITING_TESTCASE', botProjectId: projectId },
    });
  }

  return createdCount;
}
