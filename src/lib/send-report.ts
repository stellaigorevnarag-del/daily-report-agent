const TELEGRAM_API = 'https://api.telegram.org';
const CHUNK_SIZE = 4000;

function splitText(text: string): string[] {
  const chunks: string[] = [];
  let offset = 0;

  while (offset < text.length) {
    chunks.push(text.slice(offset, offset + CHUNK_SIZE));
    offset += CHUNK_SIZE;
  }

  return chunks;
}

async function sendChunk(token: string, chatId: string, text: string): Promise<void> {
  const response = await fetch(
    `${TELEGRAM_API}/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram sendMessage error: ${error}`);
  }
}

export async function sendReport(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_MY_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_MY_CHAT_ID');
  }

  const chunks = splitText(text);

  for (const chunk of chunks) {
    await sendChunk(token, chatId, chunk);
  }
}
