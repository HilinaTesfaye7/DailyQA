const API_URL = 'http://localhost:3000/api/telegram/webhook';

async function sendWebhook(chatId, text) {
  console.log(`\n--- Simulating Message from ${chatId}: "${text}" ---`);
  
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
    
    const data = await res.json();
    console.log('Webhook Response:', data);
  } catch (error) {
    console.error('Failed to send webhook:', error.message);
  }
}

async function runTests() {
  const PENDING_USER_ID = 999999; // Has no assignments
  const ACTIVE_USER_ID = 444444; // David Active (Assigned to Seed Project Alpha)

  console.log('Starting Project Selection Flow Tests...');

  // 1. Pending user attempts to checkin
  await sendWebhook(PENDING_USER_ID, '/checkin');
  await new Promise(r => setTimeout(r, 1000));

  // 2. Active user attempts to checkin
  await sendWebhook(ACTIVE_USER_ID, '/checkin');
  await new Promise(r => setTimeout(r, 1000));

  // 3. Active user replies with invalid index (Malicious/Mistake attempt)
  await sendWebhook(ACTIVE_USER_ID, '99');
  await new Promise(r => setTimeout(r, 1000));

  // 4. Active user replies with valid project index
  await sendWebhook(ACTIVE_USER_ID, '1');
  await new Promise(r => setTimeout(r, 1000));

  console.log('\nTesting Complete! Check the Next.js server console for outbound Telegram replies.');
}

runTests();
