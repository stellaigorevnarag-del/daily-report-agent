export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessages } from '@/lib/analyze';
import { sendReport } from '@/lib/send-report';

const NO_MESSAGES_TEXT = 'Сегодня не было новых переписок';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const analysis = await analyzeMessages();
    const reportText = analysis ?? NO_MESSAGES_TEXT;

    await sendReport(reportText);

    return NextResponse.json({
      ok: true,
      hasMessages: analysis !== null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[daily-report] Error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
