# Daily Report Agent

## Что это
Telegram-агент для топ-менеджеров. Собирает все переписки за день
в Supabase и присылает вечерний отчёт с анализом через GPT-5.4 mini.

## Стек
- Next.js (App Router), TypeScript strict
- Telegram Business API
- Supabase (PostgreSQL) — доступ через fetch к REST API
- OpenAI API — используй официальный openai SDK, НЕ raw fetch
- Vercel (деплой + крон)

## Правила
- TypeScript strict
- Все env-переменные только из process.env
- API Routes в src/app/api/
- Для OpenAI ВСЕГДА используй пакет openai (не fetch напрямую)
- При работе с библиотеками ВСЕГДА use context7
- В роут /api/cron/daily-report добавь: export const dynamic = 'force-dynamic'