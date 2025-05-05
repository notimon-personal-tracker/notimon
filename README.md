# Notimon

A quantified self app to help you track anything about yourself.

The first iteration is a telegram bot that periodically asks you questions and stores your responses for later analysis.

## Development

Run the database

```docker compose up db
```

Install dependencies

```bash
# Install dependencies
npm install
```

Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Make and run database migrations locally
npx prisma migrate dev
```

Run the dev server

```
npm run dev
```

For local HTTPS development with Telegram webhooks, you can use [ngrok](https://ngrok.com) to create a secure tunnel to your local server.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Deployment

### Setting up the Telegram Webhook

Set up the Telegram webhook using the following command (replace with your values):
```bash
curl -F "url=https://your-domain.com/api/telegram/webhook" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

### Environment Variables

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notimon"
TELEGRAM_BOT_TOKEN="your_bot_token_here"
```

### Run migrations

```
npx prisma migrate deploy
```

## Sending questions regularly

### Using npm
```bash
npm run send-questions
```

### Using ts-node directly
```bash
ts-node --project tsconfig.node.json scripts/sendDailyQuestions.ts
```

### Setting up as a Cron Job

e.g.

```bash
0 9 * * * cd /path/to/notimon && /usr/local/bin/npm run send-questions
```
