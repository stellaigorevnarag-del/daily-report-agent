import OpenAI from 'openai';

interface Message {
  id: number;
  chat_id: number;
  from_name: string;
  from_username: string | null;
  message_text: string | null;
  business_connection_id: string | null;
  received_at: string; // ← было created_at
}

interface DialogGroup {
  chat_id: number;
  from_name: string;
  from_username: string | null;
  messages: string[];
}

async function fetchTodayMessages(): Promise<Message[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const params = new URLSearchParams({
    select: '*',
    received_at: `gte.${todayStart.toISOString()}`, // ← было created_at
    order: 'received_at.asc', // ← было created_at.asc
  });

  const response = await fetch(
    `${supabaseUrl}/rest/v1/messages?${params.toString()}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase fetch error: ${error}`);
  }

  return response.json();
}

function groupByChat(messages: Message[]): DialogGroup[] {
  const map = new Map<number, DialogGroup>();

  for (const msg of messages) {
    if (!msg.message_text) continue;

    if (!map.has(msg.chat_id)) {
      map.set(msg.chat_id, {
        chat_id: msg.chat_id,
        from_name: msg.from_name,
        from_username: msg.from_username,
        messages: [],
      });
    }

    map.get(msg.chat_id)!.messages.push(msg.message_text);
  }

  return Array.from(map.values());
}

function buildPrompt(dialogs: DialogGroup[]): string {
  const dialogsText = dialogs
    .map((d) => {
      const name = d.from_username
        ? `${d.from_name} (@${d.from_username})`
        : d.from_name;
      const messages = d.messages.map((m) => `  - ${m}`).join('\n');
      return `Диалог с ${name} (chat_id: ${d.chat_id}):\n${messages}`;
    })
    .join('\n\n');

  return `Ты — персональный ассистент топ-менеджера.
Проанализируй переписки за сегодня.
Для каждого диалога определи:
- Тема разговора
- Ключевые решения
- Незакрытые вопросы

В конце: Топ-5 событий дня, кому ответить, рекомендации.

${dialogsText}`;
}

export async function analyzeMessages(): Promise<string | null> {
  const messages = await fetchTodayMessages();

  if (messages.length === 0) {
    return null;
  }

  const dialogs = groupByChat(messages);

  if (dialogs.length === 0) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-5.4-mini',
    messages: [{ role: 'user', content: buildPrompt(dialogs) }],
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}
