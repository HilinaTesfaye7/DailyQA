/**
 * Sends a Telegram message. Never throws: failures are logged so callers
 * (webhook handlers, cron jobs) can continue and still return 200.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: { markdown?: boolean } = {}
) {
  console.log(`\n[TELEGRAM OUTBOUND -> ${chatId}]:\n${text}\n`);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(options.markdown ? { parse_mode: 'Markdown' } : {}),
      }),
    });
    // Markdown fails on user text with stray `_` or `*`; retry as plain text.
    if (!res.ok && options.markdown) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
  } catch (err) {
    console.error('Telegram API error:', err);
  }
}
