import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Get exact current date in Ethiopia Time
    const ethiopiaDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

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

      // 4. Send the Telegram reminder (Mocked in logs for testing as we don't have real bot token)
      console.log(`\n[TELEGRAM OUTBOUND -> ${tester.telegramId}]:\n⏰ Friendly Reminder: It's 11:30 AM! Please submit your daily QA Check-in.\nUse /checkin to get started.`);

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
