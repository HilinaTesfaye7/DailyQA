const API_URL = 'http://localhost:3000/api/telegram/webhook';

async function sendWebhook(chatId, text) {
  console.log(`\n[TEST] Sending: "${text}"`);
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: Date.now(),
        message: {
          message_id: 1,
          from: { id: chatId, first_name: "TestUser" },
          chat: { id: chatId, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: text
        }
      })
    });
    
    await res.json();
    await new Promise(r => setTimeout(r, 800)); // Small delay to let DB settle and logs print cleanly
  } catch (error) {
    console.error('Failed to send webhook:', error.message);
  }
}

async function runTests() {
  const ACTIVE_USER_ID = 333333; // Charlie Active (Assigned to Project -> Module)

  console.log('Starting Full QA Check-in Flow Test...');

  // Full Flow
  await sendWebhook(ACTIVE_USER_ID, '/checkin');
  await sendWebhook(ACTIVE_USER_ID, '1'); // Select Project
  await sendWebhook(ACTIVE_USER_ID, '1'); // Select Module
  
  await sendWebhook(ACTIVE_USER_ID, 'I verified the authentication edge cases today.'); // Work summary
  
  await sendWebhook(ACTIVE_USER_ID, 'Yes'); // Blocker? Yes
  await sendWebhook(ACTIVE_USER_ID, 'The staging environment DB went down for 2 hours.'); // Blocker Details
  
  await sendWebhook(ACTIVE_USER_ID, 'I will finish testing the password reset flow tomorrow.'); // Next Plan
  await sendWebhook(ACTIVE_USER_ID, 'Found 3 critical security vulnerabilities.'); // Achievement
  
  await sendWebhook(ACTIVE_USER_ID, 'test'); // Intentional bad numeric input
  await sendWebhook(ACTIVE_USER_ID, '10'); // Tests Executed
  await sendWebhook(ACTIVE_USER_ID, '5'); // Tests Passed
  await sendWebhook(ACTIVE_USER_ID, '3'); // Tests Failed
  await sendWebhook(ACTIVE_USER_ID, '2'); // Tests Blocked

  console.log('\nTesting Complete! Check the Next.js server console for outbound Telegram replies and DB verification.');
}

runTests();
