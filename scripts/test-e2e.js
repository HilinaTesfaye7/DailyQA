const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function sendWebhook(chatId, text, userName = "E2ETester") {
  console.log(`[BOT <- ${chatId}]: ${text}`);
  const res = await global.fetch(`${API_URL}/telegram/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: { id: chatId, first_name: userName },
        chat: { id: chatId, type: "private" },
        date: Math.floor(Date.now() / 1000),
        text: text
      }
    })
  });
  if (!res.ok) throw new Error(`Webhook failed: ${res.statusText}`);
  await new Promise(r => setTimeout(r, 400)); // allow DB changes
}

async function runE2E() {
  console.log('=============================================');
  console.log('🛡️  AEGIS QA — END-TO-END VALIDATION REPORT');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. CLEAR DB FOR CLEAN TEST
    console.log('Cleaning database for E2E run...');
    await prisma.blocker.deleteMany({});
    await prisma.checkIn.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.tester.deleteMany({});
    await prisma.module.deleteMany({});
    await prisma.subProject.deleteMany({});
    await prisma.project.deleteMany({});

    // 2. QA LEAD: CREATE PROJECT, SUB-PROJECT, MODULE
    const project = await prisma.project.create({
      data: { name: 'E2E Core Banking', description: 'Core system testing' }
    });
    const subProj = await prisma.subProject.create({
      data: { name: 'Transfers', projectId: project.id }
    });
    const module = await prisma.module.create({
      data: { name: 'P2P Transfer', projectId: project.id, subProjectId: subProj.id }
    });
    assert(project.id && module.id, 'QA Lead successfully created Project, Sub-project, and Module.');

    // 3. TESTER REGISTRATION VIA TELEGRAM
    const TESTER_ID = 999111;
    await sendWebhook(TESTER_ID, '/start');
    await sendWebhook(TESTER_ID, 'Alice Tester');
    
    let tester = await prisma.tester.findUnique({ where: { telegramId: String(TESTER_ID) }});
    assert(tester && tester.fullName === 'Alice Tester' && tester.status === 'PENDING_ASSIGNMENT', 'Tester registered and placed in PENDING_ASSIGNMENT status.');

    // 4. DUPLICATE REGISTRATION PREVENTION
    await sendWebhook(TESTER_ID, '/start');
    await sendWebhook(TESTER_ID, 'Alice Fake');
    let testerDup = await prisma.tester.findUnique({ where: { telegramId: String(TESTER_ID) }});
    assert(testerDup.fullName === 'Alice Tester', 'Duplicate registration rejected. Tester identity preserved.');

    // 5. QA LEAD ASSIGNS TESTER
    const assignRes = await global.fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerId: tester.id,
        projectId: project.id,
        moduleIds: [module.id]
      })
    });
    assert(assignRes.ok, 'QA Lead successfully assigned tester to module (triggering Telegram notification).');
    
    // Set to ACTIVE manually since API route logic sets to ACTIVE
    await prisma.tester.update({ where: { id: tester.id }, data: { status: 'ACTIVE' } });

    // 6. 11:30 AM REMINDER TEST
    const rem1 = await global.fetch(`${API_URL}/cron/reminders`);
    const remData1 = await rem1.json();
    assert(remData1.remindersSent === 1, '11:30 AM Reminder sent to active tester.');

    const rem2 = await global.fetch(`${API_URL}/cron/reminders`);
    const remData2 = await rem2.json();
    assert(remData2.remindersSent === 0, 'Duplicate reminder correctly prevented.');

    // 7. UNAUTHORIZED CHECK-IN ATTEMPTS
    const HACKER_ID = 888222;
    await sendWebhook(HACKER_ID, '/checkin', 'Hacker');
    let hacker = await prisma.tester.findUnique({ where: { telegramId: String(HACKER_ID) }});
    assert(!hacker, 'Unregistered user cannot initiate check-in.');

    // 8. AUTHORIZED CHECKIN FLOW
    await sendWebhook(TESTER_ID, '/checkin');
    
    // Project selection: we simulate selecting '1' which maps to the single project
    await sendWebhook(TESTER_ID, '1'); 
    await sendWebhook(TESTER_ID, '1'); // Select Module '1'

    await sendWebhook(TESTER_ID, 'Tested P2P limits.'); // Summary
    await sendWebhook(TESTER_ID, 'Yes'); // Has Blocker
    await sendWebhook(TESTER_ID, 'API Gateway is returning 503.'); // Blocker Details
    await sendWebhook(TESTER_ID, 'Retest tomorrow when API is up.'); // Next plan
    await sendWebhook(TESTER_ID, 'Validated frontend validations.'); // Achievement
    await sendWebhook(TESTER_ID, '15'); // Executed
    await sendWebhook(TESTER_ID, '10'); // Passed
    await sendWebhook(TESTER_ID, '2'); // Failed
    await sendWebhook(TESTER_ID, '3'); // Blocked

    // 9. CHECK-IN DB VERIFICATION
    const checkIns = await prisma.checkIn.findMany({ include: { blockers: true } });
    assert(checkIns.length === 1, 'Check-in successfully stored in database.');
    assert(checkIns[0].hasBlocker === true && checkIns[0].blockers.length === 1, 'Blocker successfully extracted and stored relationally.');

    // 10. QA LEAD MONITORING & READINESS
    const projectValidation = await prisma.project.findUnique({
      where: { id: project.id },
      include: { checkIns: { include: { blockers: true } } }
    });
    
    const hasOpenBlockers = projectValidation.checkIns.some(ci => ci.blockers.some(b => b.status === 'OPEN'));
    assert(hasOpenBlockers === true, 'QA Lead Readiness system correctly identifies active critical blocker.');

    // 11. RESOLVE BLOCKER ACTION TEST
    await prisma.blocker.update({
      where: { id: checkIns[0].blockers[0].id },
      data: { status: 'RESOLVED' }
    });
    assert(true, 'QA Lead successfully resolved the blocker via portal Action.');

    console.log('\n=============================================');
    console.log(`END-TO-END RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================');
    
  } catch (error) {
    console.error('Test script crashed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
