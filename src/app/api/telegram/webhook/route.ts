import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update.message || !update.message.text || !update.message.chat) {
      return NextResponse.json({ success: true });
    }

    const telegramId = update.message.chat.id.toString();
    const text = update.message.text.trim();

    const sendMessage = async (msg: string) => {
      console.log(`\n[TELEGRAM OUTBOUND -> ${telegramId}]:\n${msg}\n`);
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramId, text: msg })
        }).catch(err => console.error('Telegram API error:', err));
      }
    };

    let qaLead = await prisma.qALead.findUnique({
      where: { telegramId }
    });

    let tester = await prisma.tester.findUnique({
      where: { telegramId },
      include: {
        assignments: {
          include: { 
            project: true,
            module: true 
          }
        }
      }
    });

    // --- QA LEAD COMMANDS ---
    if (text.startsWith('/lead_auth ')) {
      const password = text.split(' ')[1];
      if (password === 'secret_lead_2026') { // Hardcoded for demo/simplicity
        // Get the first QA lead from DB to attach to
        const lead = await prisma.qALead.findFirst();
        if (lead) {
          await prisma.qALead.update({
            where: { id: lead.id },
            data: { telegramId }
          }); sendMessage('✅ Successfully authenticated as QA Lead. You will now receive blocker and achievement alerts.\n\nType /status to check project readiness.');
        } else { sendMessage('❌ No QA Lead account found in the system to link.');
        }
      } else { sendMessage('❌ Invalid lead authentication password.');
      }
      return NextResponse.json({ success: true });
    }

    const getPayload = () => tester!.botStateData ? JSON.parse(tester!.botStateData) : {};
    const savePayload = async (newState: string, data: any) => {
      await prisma.tester.update({
        where: { telegramId },
        data: { 
          botState: newState,
          botStateData: JSON.stringify(data)
        }
      });
    };

    if (qaLead && text === '/status') {
      const projects = await prisma.project.findMany({
        where: { status: { not: 'COMPLETED' } },
        include: { checkIns: { include: { blockers: { where: { status: 'OPEN' } } } } }
      });
      
      let statusMsg = `📊 *QA Command Center Status*\n\n`;
      projects.forEach(p => {
        let openBlockers = 0;
        p.checkIns.forEach(ci => openBlockers += ci.blockers.length);
        const readiness = openBlockers > 0 ? '🔴 AT RISK' : '🟢 READY';
        statusMsg += `*${p.name}* - ${readiness}\nBlockers: ${openBlockers}\n\n`;
      }); sendMessage(statusMsg);
      return NextResponse.json({ success: true });
    }

    if (qaLead && text === '/report') {
      const ethiopiaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Addis_Ababa' }).format(new Date());
      const checkIns = await prisma.checkIn.findMany({
        where: { ethiopiaDate: ethiopiaToday },
        include: { tester: true, project: true, module: true }
      });

      if (checkIns.length === 0) { sendMessage('No daily check-ins reported today yet.');
      } else {
        let msg = `📅 *Daily Check-in Report (${ethiopiaToday})*\n\n`;
        checkIns.forEach(ci => {
          msg += `👤 *Tester*: ${ci.tester.fullName}\n`;
          msg += `📁 *Project*: ${ci.project.name}\n`;
          if (ci.module) msg += `🧩 *Module*: ${ci.module.name}\n`;
          msg += `📝 *Completed*: ${ci.workCompleted}\n`;
          msg += `----------------------\n`;
        }); sendMessage(msg);
      }
      return NextResponse.json({ success: true });
    }

    if (qaLead && text === '/readiness') {
      const projects = await prisma.project.findMany({
        include: { 
          assignments: true,
          checkIns: { include: { blockers: true } }
        }
      });
      
      let msg = `🚀 *Overall Project Readiness*\n\n`;
      projects.forEach(project => {
        let totalTests = 0;
        project.assignments.forEach(a => totalTests += a.totalTests || 0);

        const latestCheckInsMap = new Map();
        project.checkIns.forEach(ci => {
          const key = `${ci.testerId}-${ci.moduleId || 'FULL_PROJECT'}`;
          if (!latestCheckInsMap.has(key)) {
            latestCheckInsMap.set(key, ci);
          } else {
            const existing = latestCheckInsMap.get(key);
            if (new Date(ci.date).getTime() > new Date(existing.date).getTime()) {
              latestCheckInsMap.set(key, ci);
            }
          }
        });

        let testsPassed = 0;
        Array.from(latestCheckInsMap.values()).forEach(ci => {
          testsPassed += ci.testsPassed;
        });

        let openBlockers = 0;
        project.checkIns.forEach(ci => {
          if (ci.blockers.some(b => b.status === 'OPEN')) openBlockers++;
        });

        const progress = totalTests > 0 ? Math.min(100, Math.round((testsPassed / totalTests) * 100)) : 0;
        const isReady = totalTests > 0 && testsPassed >= totalTests && openBlockers === 0;

        msg += `*${project.name}* - ${isReady ? '🟢 READY FOR RELEASE' : '🔴 IN TESTING'}\n`;
        msg += `Progress: ${progress}% (${testsPassed}/${totalTests} Passed)\n`;
        msg += `Active Blockers: ${openBlockers}\n\n`;
      }); sendMessage(msg);
      return NextResponse.json({ success: true });
    }

    // 1. Handle Registration: /start
    if (text === '/start') {
      if (tester) {
        if (tester.botState === 'AWAITING_ROLE') { sendMessage('Are you a QA Lead or a Tester? (Reply "Lead" or "Tester")');
        } else if (tester.botState === 'AWAITING_NAME') { sendMessage('Please enter your full name.');
        } else { sendMessage('You are already registered with AegisQA.');
        }
      } else if (qaLead) { sendMessage('You are already registered as a QA Lead.');
      } else {
        await prisma.tester.create({
          data: {
            telegramId,
            fullName: 'Unknown',
            status: 'PENDING_ASSIGNMENT',
            botState: 'AWAITING_ROLE'
          }
        }); sendMessage('Welcome to AegisQA 👋\n\nAre you a QA Lead or a Tester? (Reply "Lead" or "Tester")');
      }
      return NextResponse.json({ success: true });
    }

    if (tester && tester.botState === 'AWAITING_ROLE') {
      const role = text.toLowerCase();
      if (role === 'lead') {
        await prisma.tester.delete({ where: { id: tester.id } });
        await prisma.qALead.create({
          data: {
            username: telegramId,
            passwordHash: 'N/A',
            telegramId: telegramId
          }
        }); sendMessage('✅ Successfully registered as QA Lead. You will receive blocker and achievement alerts.\n\nAvailable commands:\n/status - Basic project status\n/report - Daily check-in report\n/readiness - Overall project readiness');
      } else if (role === 'tester') {
        await prisma.tester.update({
          where: { telegramId },
          data: { botState: 'AWAITING_NAME' }
        }); sendMessage('Great! Please enter your full name:');
      } else { sendMessage('Please reply with exactly "Lead" or "Tester".');
      }
      return NextResponse.json({ success: true });
    }

    // 3. Handle incoming test case submission
    if (tester && tester.botState === 'AWAITING_TESTCASE') {
      if (text.toLowerCase() !== 'skip') {
        if (!tester.botProjectId) { sendMessage('Error: No project context found. Please contact an admin.');
        } else {
           await prisma.testCase.create({
             data: {
               projectId: tester.botProjectId,
               testerId: tester.id,
               content: text
             }
           });
           
           // Notify QA Lead
           const leads = await prisma.qALead.findMany({ where: { telegramId: { not: null } } });
           for (const lead of leads) {
             const alertMsg = `📝 *New Test Case Submitted*\n\nTester: ${tester.fullName}\nProject ID: ${tester.botProjectId}\nLink/Text: ${text}`;
             await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ chat_id: lead.telegramId, text: alertMsg, parse_mode: 'Markdown' })
             });
           }
        }
      }
      
      await prisma.tester.update({
        where: { id: tester.id },
        data: { botState: 'IDLE', botProjectId: null }
      }); sendMessage('Got it! You are now fully setup for this project. Use /checkin when you are ready to report your daily standup.');
      return NextResponse.json({ success: true });
    }

    // 2. Handle Registration: Name Entry
    if (tester && tester.botState === 'AWAITING_NAME') {
      const fullName = text;
      await prisma.tester.update({
        where: { telegramId },
        data: {
          fullName,
          status: 'PENDING_ASSIGNMENT',
          botState: 'IDLE'
        }
      }); sendMessage(`Thank you, ${fullName}.\n\nYour registration has been received successfully.\n\nYou have not been assigned to a project yet.\n\nPlease wait for the QA Lead to assign you to a project.\n\nYou will receive a notification when you are assigned.`);
      return NextResponse.json({ success: true });
    }

    // 3. Handle Workflow: /checkin (Project Selection Initiation)
    if (text === '/checkin') {
      if (!tester) { sendMessage('You are not registered.');
        return NextResponse.json({ success: true });
      }

      if (tester.status === 'PENDING_ASSIGNMENT' || tester.assignments.length === 0) { sendMessage('You are not currently assigned to any projects. Please wait for an assignment.');
        return NextResponse.json({ success: true });
      }

      const openBlockers = await prisma.blocker.findMany({
        where: {
          status: 'OPEN',
          checkIn: { testerId: tester.id }
        },
        include: { checkIn: { include: { project: true } } }
      });

      if (openBlockers.length > 0) {
        const blocker = openBlockers[0]; // Intercept the first open blocker
        await prisma.tester.update({
          where: { telegramId },
          data: {
            botState: 'AWAITING_BLOCKER_RESOLUTION',
            botStateData: JSON.stringify({ blockerId: blocker.id })
          }
        }); sendMessage(`Before checking in, you have an unresolved blocker from a previous check-in on project ${blocker.checkIn.project.name}:\n\n"${blocker.description}"\n\nIs this blocker resolved? (Reply Yes or No)`);
        return NextResponse.json({ success: true });
      }

      const uniqueProjects = new Map();
      tester.assignments.forEach(a => {
        if (a.project.status !== 'COMPLETED' && a.project.status !== 'READY FOR RELEASE') {
          if (!uniqueProjects.has(a.projectId)) {
            uniqueProjects.set(a.projectId, a.project);
          }
        }
      });

      const projectsList = Array.from(uniqueProjects.values());
      if (projectsList.length === 0) { sendMessage('You do not have any active projects to check in on right now.');
        return NextResponse.json({ success: true });
      }
      
      let msg = 'Select your project:\n\n';
      projectsList.forEach((p, index) => {
        msg += `[${index + 1}] ${p.name}\n`;
      });

      await prisma.tester.update({
        where: { telegramId },
        data: { 
          botState: 'AWAITING_PROJECT_SELECTION',
          botProjectId: null,
          botModuleId: null,
          botStateData: null
        }
      }); sendMessage(msg.trim());
      return NextResponse.json({ success: true });
    }

    if (tester && tester.botState === 'AWAITING_BLOCKER_RESOLUTION') {
      const payload = getPayload();
      const normalized = text.toLowerCase();
      if (normalized === 'yes' || normalized === 'y') {
        const blocker = await prisma.blocker.update({
          where: { id: payload.blockerId },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
          include: { checkIn: { include: { project: true } } }
        });
        
        const leads = await prisma.qALead.findMany({ where: { telegramId: { not: null } } });
        for (const lead of leads) {
          const alertMsg = `✅ *Blocker Resolved*\n\nTester: ${tester.fullName}\nProject: ${blocker.checkIn.project.name}\nBlocker: ${blocker.description}`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: lead.telegramId, text: alertMsg, parse_mode: 'Markdown' })
          }).catch(() => {});
        } sendMessage('Great! Blocker marked as resolved.');
      } else if (normalized === 'no' || normalized === 'n') { sendMessage('Okay, blocker remains open.');
      } else { sendMessage('Please reply with Yes or No.');
        return NextResponse.json({ success: true });
      }

      const uniqueProjects = new Map();
      tester.assignments.forEach(a => {
        if (a.project.status !== 'COMPLETED' && a.project.status !== 'READY FOR RELEASE') {
          if (!uniqueProjects.has(a.projectId)) {
            uniqueProjects.set(a.projectId, a.project);
          }
        }
      });

      const projectsList = Array.from(uniqueProjects.values());
      if (projectsList.length === 0) {
        await prisma.tester.update({
          where: { telegramId },
          data: { botState: 'IDLE', botStateData: null }
        }); sendMessage('You do not have any active projects to check in on right now.');
        return NextResponse.json({ success: true });
      }
      
      let msg = 'Select your project:\n\n';
      projectsList.forEach((p, index) => {
        msg += `[${index + 1}] ${p.name}\n`;
      });

      await prisma.tester.update({
        where: { telegramId },
        data: { 
          botState: 'AWAITING_PROJECT_SELECTION',
          botProjectId: null,
          botModuleId: null,
          botStateData: null
        }
      }); sendMessage(msg.trim());
      return NextResponse.json({ success: true });
    }

    // 4. Handle Workflow: Project Selection
    if (tester && tester.botState === 'AWAITING_PROJECT_SELECTION') {
      const selectionIndex = parseInt(text, 10) - 1;
      
      const uniqueProjects = new Map();
      tester.assignments.forEach(a => {
        if (a.project.status !== 'COMPLETED' && a.project.status !== 'READY FOR RELEASE') {
          if (!uniqueProjects.has(a.projectId)) {
            uniqueProjects.set(a.projectId, a.project);
          }
        }
      });
      const projectsList = Array.from(uniqueProjects.values());

      if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= projectsList.length) { sendMessage('Invalid selection. Please reply with the number corresponding to your project.');
        return NextResponse.json({ success: true });
      }

      const selectedProject = projectsList[selectionIndex];

      const projectAssignments = tester.assignments.filter(a => a.projectId === selectedProject.id);
      const uniqueModules = new Map();
      let hasFullProject = false;
      
      projectAssignments.forEach(a => {
        if (a.moduleId && a.module) {
          if (!uniqueModules.has(a.moduleId)) {
            uniqueModules.set(a.moduleId, a.module);
          }
        } else {
          hasFullProject = true;
        }
      });

      const modulesList = Array.from(uniqueModules.values());
      if (hasFullProject) {
        modulesList.push({ id: 'NONE', name: 'Full Project' });
      }

      if (modulesList.length === 0) {
        await prisma.tester.update({
          where: { telegramId },
          data: { 
            botState: 'IDLE',
            botProjectId: null,
            botModuleId: null
          }
        }); sendMessage(`You selected: ${selectedProject.name}, but you have no assignments under this project. Please contact the QA Lead.`);
        return NextResponse.json({ success: true });
      }

      if (modulesList.length === 1) {
        await prisma.tester.update({
          where: { telegramId },
          data: { 
            botState: 'AWAITING_WORK_SUMMARY',
            botProjectId: selectedProject.id,
            botModuleId: modulesList[0].id
          }
        }); sendMessage(`Automatically selected: ${modulesList[0].name}\n\nWhat did you work on today?`);
        return NextResponse.json({ success: true });
      }

      let msg = 'Select your module:\n\n';
      modulesList.forEach((m, index) => {
        msg += `[${index + 1}] ${m.name}\n`;
      });

      await prisma.tester.update({
        where: { telegramId },
        data: { 
          botState: 'AWAITING_MODULE_SELECTION',
          botProjectId: selectedProject.id 
        }
      }); sendMessage(msg.trim());
      return NextResponse.json({ success: true });
    }

    // 5. Handle Workflow: Module Selection
    if (tester && tester.botState === 'AWAITING_MODULE_SELECTION') {
      const selectionIndex = parseInt(text, 10) - 1;

      const projectAssignments = tester.assignments.filter(a => a.projectId === tester.botProjectId);
      const uniqueModules = new Map();
      let hasFullProject = false;
      
      projectAssignments.forEach(a => {
        if (a.moduleId && a.module) {
          if (!uniqueModules.has(a.moduleId)) {
            uniqueModules.set(a.moduleId, a.module);
          }
        } else {
          hasFullProject = true;
        }
      });
      const modulesList = Array.from(uniqueModules.values());
      if (hasFullProject) {
        modulesList.push({ id: 'NONE', name: 'Full Project' });
      }

      if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= modulesList.length) { sendMessage('Invalid selection. Please reply with the number corresponding to your module.');
        return NextResponse.json({ success: true });
      }

      const selectedModule = modulesList[selectionIndex];

      await prisma.tester.update({
        where: { telegramId },
        data: { 
          botState: 'AWAITING_WORK_SUMMARY',
          botModuleId: selectedModule.id 
        }
      }); sendMessage('What did you work on today?');
      return NextResponse.json({ success: true });
    }

    // 6. Check-in Flow Logic Helpers

    // 6a. AWAITING_WORK_SUMMARY
    if (tester && tester.botState === 'AWAITING_WORK_SUMMARY') {
      const payload = getPayload();
      payload.workCompleted = text;
      await savePayload('AWAITING_BLOCKER_STATUS', payload); sendMessage('Did you encounter a blocker? (Yes/No)');
      return NextResponse.json({ success: true });
    }

    // 6b. AWAITING_BLOCKER_STATUS
    if (tester && tester.botState === 'AWAITING_BLOCKER_STATUS') {
      const payload = getPayload();
      const normalized = text.toLowerCase();
      if (normalized === 'yes' || normalized === 'y') {
        payload.hasBlocker = true;
        await savePayload('AWAITING_BLOCKER_DETAILS', payload); sendMessage('Please provide blocker details:');
      } else if (normalized === 'no' || normalized === 'n') {
        payload.hasBlocker = false;
        payload.blockerDescription = null;
        await savePayload('AWAITING_NEXT_PLAN', payload); sendMessage('What is your next plan?');
      } else { sendMessage('Please reply with Yes or No.');
      }
      return NextResponse.json({ success: true });
    }

    // 6c. AWAITING_BLOCKER_DETAILS
    if (tester && tester.botState === 'AWAITING_BLOCKER_DETAILS') {
      const payload = getPayload();
      payload.blockerDescription = text;
      await savePayload('AWAITING_NEXT_PLAN', payload); sendMessage('What is your next plan?');
      return NextResponse.json({ success: true });
    }

    // 6d. AWAITING_NEXT_PLAN
    if (tester && tester.botState === 'AWAITING_NEXT_PLAN') {
      const payload = getPayload();
      payload.nextPlan = text;
      await savePayload('AWAITING_ACHIEVEMENT', payload); sendMessage('What did you achieve today?');
      return NextResponse.json({ success: true });
    }

    // 6e. AWAITING_ACHIEVEMENT
    if (tester && tester.botState === 'AWAITING_ACHIEVEMENT') {
      const payload = getPayload();
      payload.achievement = text;
      
      const assignment = await prisma.assignment.findFirst({
        where: {
          testerId: tester.id,
          projectId: tester.botProjectId!,
          moduleId: tester.botModuleId === 'NONE' ? null : tester.botModuleId!
        }
      });

      if (assignment && assignment.totalTests > 0) {
        payload.totalTests = assignment.totalTests;
        await savePayload('AWAITING_TESTS_EXECUTED', payload); sendMessage('How many test cases did you execute? (Number only)');
      } else {
        await savePayload('AWAITING_TOTAL_TESTS', payload); sendMessage('How many total test cases are planned/assigned? (Number only)');
      }
      return NextResponse.json({ success: true });
    }

    // Numeric Validation Helper
    const parseNum = (val: string) => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 0 ? null : num;
    };

    // 6e2. AWAITING_TOTAL_TESTS
    if (tester && tester.botState === 'AWAITING_TOTAL_TESTS') {
      const num = parseNum(text);
      if (num === null || num === 0) { sendMessage('Please enter a valid positive number greater than 0.');
        return NextResponse.json({ success: true });
      }
      
      const payload = getPayload();
      payload.totalTests = num;
      
      await prisma.assignment.updateMany({
        where: {
          testerId: tester.id,
          projectId: tester.botProjectId!,
          moduleId: tester.botModuleId === 'NONE' ? null : tester.botModuleId!
        },
        data: { totalTests: num }
      });

      await savePayload('AWAITING_TESTS_EXECUTED', payload); sendMessage('How many test cases did you execute? (Number only)');
      return NextResponse.json({ success: true });
    }


    // 6f. AWAITING_TESTS_EXECUTED
    if (tester && tester.botState === 'AWAITING_TESTS_EXECUTED') {
      const num = parseNum(text);
      if (num === null) { sendMessage('Please enter a valid positive number.');
        return NextResponse.json({ success: true });
      }
      
      const payload = getPayload();
      if (num > (payload.totalTests || 0)) { sendMessage(`You cannot execute more tests (${num}) than the total planned (${payload.totalTests}). Please enter a valid number.`);
        return NextResponse.json({ success: true });
      }

      payload.testsExecuted = num;
      await savePayload('AWAITING_TESTS_PASSED', payload); sendMessage('How many test cases passed? (Number only)');
      return NextResponse.json({ success: true });
    }

    // 6g. AWAITING_TESTS_PASSED
    if (tester && tester.botState === 'AWAITING_TESTS_PASSED') {
      const num = parseNum(text);
      if (num === null) { sendMessage('Please enter a valid positive number.');
        return NextResponse.json({ success: true });
      }
      
      const payload = getPayload();
      if (num > payload.testsExecuted) { sendMessage(`You cannot have more passed tests (${num}) than executed tests (${payload.testsExecuted}). Please enter a valid number.`);
        return NextResponse.json({ success: true });
      }

      payload.testsPassed = num;
      await savePayload('AWAITING_TESTS_FAILED', payload); sendMessage('How many test cases failed? (Number only)');
      return NextResponse.json({ success: true });
    }

    // 6h. AWAITING_TESTS_FAILED
    if (tester && tester.botState === 'AWAITING_TESTS_FAILED') {
      const num = parseNum(text);
      if (num === null) { sendMessage('Please enter a valid positive number.');
        return NextResponse.json({ success: true });
      }
      
      const payload = getPayload();
      if (payload.testsPassed + num > payload.testsExecuted) { sendMessage(`Passed (${payload.testsPassed}) + Failed (${num}) cannot exceed total Executed (${payload.testsExecuted}). Please enter a valid number.`);
        return NextResponse.json({ success: true });
      }

      payload.testsFailed = num;
      await savePayload('AWAITING_TESTS_BLOCKED', payload); sendMessage('How many test cases were blocked? (Number only)');
      return NextResponse.json({ success: true });
    }

    // 6i. AWAITING_TESTS_BLOCKED (Final Step - Save DB)
    if (tester && tester.botState === 'AWAITING_TESTS_BLOCKED') {
      const num = parseNum(text);
      if (num === null) { sendMessage('Please enter a valid number.');
        return NextResponse.json({ success: true });
      }
      
      const payload = getPayload();
      payload.testsBlocked = num;

      // Final Check-in Compilation
      const ethiopiaDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Addis_Ababa',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const checkIn = await prisma.checkIn.create({
        data: {
          testerId: tester.id,
          projectId: tester.botProjectId!,
          moduleId: tester.botModuleId === 'NONE' ? '' : tester.botModuleId!,
          ethiopiaDate: ethiopiaDate,
          workCompleted: payload.workCompleted,
          hasBlocker: payload.hasBlocker,
          blockerDescription: payload.blockerDescription || null,
          nextPlan: payload.nextPlan,
          achievement: payload.achievement,
          testsExecuted: payload.testsExecuted || 0,
          testsPassed: payload.testsPassed || 0,
          testsFailed: payload.testsFailed || 0,
          testsBlocked: payload.testsBlocked || 0
        }
      });

      if (payload.hasBlocker && payload.blockerDescription) {
        await prisma.blocker.create({
          data: {
            checkInId: checkIn.id,
            description: payload.blockerDescription,
            status: 'OPEN'
          }
        });
      }

      // Proactive QA Lead Notifications
      const leads = await prisma.qALead.findMany({
        where: { telegramId: { not: null } }
      });
      
      for (const lead of leads) {
        if (payload.hasBlocker) {
          const alertMsg = `🚨 *New Blocker Alert*\n\nTester: ${tester.fullName}\nProject ID: ${tester.botProjectId}\nBlocker: ${payload.blockerDescription}`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: lead.telegramId, text: alertMsg, parse_mode: 'Markdown' })
          });
        }
        if (payload.achievement && payload.achievement.toLowerCase() !== 'none') {
          const alertMsg = `🎉 *Achievement Unlocked*\n\nTester: ${tester.fullName}\nProject ID: ${tester.botProjectId}\nAchievement: ${payload.achievement}`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: lead.telegramId, text: alertMsg, parse_mode: 'Markdown' })
          });
        }
      }

      // Reset state completely
      await prisma.tester.update({
        where: { telegramId },
        data: { 
          botState: 'IDLE',
          botProjectId: null,
          botModuleId: null,
          botStateData: null
        }
      }); sendMessage('✅ Daily QA check-in submitted.');
      return NextResponse.json({ success: true });
    }

    // Fallback
    if (tester) { sendMessage('Your message was received, but no active command was triggered.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
