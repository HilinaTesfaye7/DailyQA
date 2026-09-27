const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
let TOKEN = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/TELEGRAM_BOT_TOKEN="([^"]+)"/);
  if (match) TOKEN = match[1];
}

const WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook';

if (!TOKEN) {
  console.error("No TELEGRAM_BOT_TOKEN found in .env");
  process.exit(1);
}

let lastUpdateId = 0;

async function poll() {
  console.log(`Polling Telegram for new messages...`);
  
  try {
    // Delete any existing webhook so Telegram allows polling
    await fetch(`https://api.telegram.org/bot${TOKEN}/deleteWebhook`);

    while (true) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId}&timeout=30`);
        const data = await res.json();
        
        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            console.log(`Received message:`, update.message?.text || '<non-text>');
            
            // Forward to the local Next.js webhook route
            await fetch(WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(update)
            });
            
            lastUpdateId = update.update_id + 1;
          }
        }
      } catch (err) {
        console.error("Polling error:", err.message);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

poll();
