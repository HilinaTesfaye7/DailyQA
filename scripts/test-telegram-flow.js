

const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook';

async function sendWebhook(chatId, text) {
  console.log(`\n--- Simulating Message from ${chatId}: "${text}" ---`);
  
  try {
    const res = await fetch(WEBHOOK_URL, {
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
    console.error('Is the Next.js server running on port 3000?');
  }
}

async function runTests() {
  const NEW_USER_ID = 999999; // Represents a new user
  const EXISTING_USER_ID = 444444; // From our seed script (David Active)

  console.log('Starting Telegram Registration Flow Tests...');

  // 1. New user registration - Step 1: /start
  await sendWebhook(NEW_USER_ID, '/start');
  await new Promise(r => setTimeout(r, 1000));

  // 2. New user registration - Step 2: Enters name
  await sendWebhook(NEW_USER_ID, 'Elias QA');
  await new Promise(r => setTimeout(r, 1000));

  // 3. Duplicate registration attempt by the new user
  await sendWebhook(NEW_USER_ID, '/start');
  await new Promise(r => setTimeout(r, 1000));

  // 4. Existing active user attempt
  await sendWebhook(EXISTING_USER_ID, '/start');
  await new Promise(r => setTimeout(r, 1000));

  console.log('\nTesting Complete! Check the Next.js server console for outbound Telegram replies.');
}

runTests();
