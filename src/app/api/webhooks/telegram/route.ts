import { NextRequest, NextResponse } from 'next/server';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number };
  text?: string;
  business_connection_id?: string;
}

interface TelegramUpdate {
  update_id: number;
  business_message?: TelegramMessage;
  message?: TelegramMessage;
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    const message = update.business_message ?? update.message;

    if (!message || !message.from) {
      return NextResponse.json({ ok: true });
    }

    // Skip bot messages
    if (message.from.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[telegram/webhook] Missing Supabase env vars');
      return NextResponse.json({ ok: true });
    }

    const payload = {
      chat_id: message.chat.id,
      from_name: [message.from.first_name, message.from.last_name]
        .filter(Boolean)
        .join(' '),
      from_username: message.from.username ?? null,
      message_text: message.text ?? null,
      business_connection_id: message.business_connection_id ?? null,
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[telegram/webhook] Supabase insert error:', error);
    }
  } catch (error) {
    console.error('[telegram/webhook] Unexpected error:', error);
  }

  // Always return 200 so Telegram does not retry
  return NextResponse.json({ ok: true });
}
