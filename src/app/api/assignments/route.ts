import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.testerId || !data.projectId) {
      return NextResponse.json({ error: 'Tester and Project are required' }, { status: 400 });
    }

    // Fetch tester and project to populate notification
    const tester = await prisma.tester.findUnique({ where: { id: data.testerId } });
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });

    if (!tester || !project) {
      return NextResponse.json({ error: 'Invalid tester or project' }, { status: 400 });
    }

    // Helper to send Telegram notification and ask for test case
    const promptForTestCase = async (moduleName: string) => {
      const msg = `🎉 You have been assigned to a project.\n\nProject: ${project.name}\n\nModule: ${moduleName}\n\nPRD:\n${project.prdLink || 'N/A'}\n\nFigma:\n${project.figmaLink || 'N/A'}\n\nWould you like to submit test cases for this assignment? (Reply with a link, description, or 'skip')`;
      console.log(`\n[TELEGRAM OUTBOUND -> ${tester.telegramId}]:\n${msg}\n`);
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tester.telegramId, text: msg })
        }).catch(err => console.error('Telegram API error:', err));
      }

      await prisma.tester.update({
        where: { id: tester.id },
        data: { 
          botState: 'AWAITING_TESTCASE',
          botProjectId: project.id 
        }
      });
    };

    let createdCount = 0;

    if (data.moduleIds && Array.isArray(data.moduleIds) && data.moduleIds.length > 0) {
      const moduleNames = [];
      for (const moduleId of data.moduleIds) {
        const existing = await prisma.assignment.findFirst({
          where: {
            testerId: data.testerId,
            projectId: data.projectId,
            moduleId: moduleId
          }
        });

        if (!existing) {
          await prisma.assignment.create({
            data: {
              testerId: data.testerId,
              projectId: data.projectId,
              moduleId: moduleId
            }
          });
          
          const moduleRecord = await prisma.module.findUnique({ where: { id: moduleId } });
          if (moduleRecord) {
            moduleNames.push(moduleRecord.name);
          }
          
          createdCount++;
        }
      }
      await promptForTestCase(moduleNames.length > 0 ? moduleNames.join(', ') : 'N/A');
    } else {
      const existing = await prisma.assignment.findFirst({
        where: {
          testerId: data.testerId,
          projectId: data.projectId,
          moduleId: null
        }
      });
      if (!existing) {
        await prisma.assignment.create({
          data: {
            testerId: data.testerId,
            projectId: data.projectId
          }
        });
        
        await promptForTestCase('N/A (Full Project)');
        createdCount++;
      }
    }

    await prisma.tester.update({
      where: { id: data.testerId },
      data: { status: 'ACTIVE' }
    });

    return NextResponse.json({ success: true, count: createdCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
