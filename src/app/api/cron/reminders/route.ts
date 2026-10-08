import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { getEthiopiaToday } from '@/lib/report';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is configured.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get exact current date in Ethiopia Time
    const ethiopiaDate = getEthiopiaToday();

    // 2. Fetch all ACTIVE testers who have NOT received a reminder today
    const testers = await prisma.tester.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { lastRemindedDate: null },
          { lastRemindedDate: { not: ethiopiaDate } }
        ]
      },
      include: {
        checkIns: {
          where: { ethiopiaDate } // Only look for today's checkins
        }
      }
    });

    let remindersSent = 0;

    for (const tester of testers) {
      // 3. Skip if they already checked in today
      if (tester.checkIns.length > 0) continue;

      // 4. Send the Telegram reminder
      await sendTelegramMessage(
        tester.telegramId,
        "⏰ Friendly Reminder: Please submit your daily QA Check-in.\nUse /checkin to get started."
      );

      // 5. Update lastRemindedDate to prevent duplicate reminders today
      await prisma.tester.update({
        where: { id: tester.id },
        data: { lastRemindedDate: ethiopiaDate }
      });

      remindersSent++;
    }

    return NextResponse.json({ success: true, remindersSent });
  } catch (error) {
    console.error('Reminder error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
