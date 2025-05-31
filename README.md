# Notimon

A quantified self app to help you track anything about yourself.

The first iteration is a telegram bot that periodically asks you questions and stores your responses for later analysis.

## Development

Run the database

```bash
docker compose up db
```

This will create two databases:
- `notimon` (main development database)
- `notimon_test` (test database)

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

## Testing

### Database Setup

The test database is automatically created when you start Docker. To manage migrations:

```bash
# Deploy all pending migrations to the test database (safe for CI/CD)
npm run prisma:migrate:test
```

### Running Tests

Before running tests for the first time, make sure to set up the test database:

```bash
npm test
```

## Admin CLI

The admin CLI allows you to manage topics and questions. Here's how to use it:

### Topics

```bash
# Create a new topic
npm run admin -- create-topic -n "Health" -d "Health-related questions"

# List all topics
npm run admin -- list-topics
```

### Questions

```bash
# Create a new question (with options)
npm run admin -- create-question -t "How many hours did you sleep?" -o "0-4" "4-6" "6-8" "8+"

# Create a question and associate it with topics
npm run admin -- create-question -t "How many hours did you sleep?" -o "0-4" "4-6" "6-8" "8+" --topics topic_id_1 topic_id_2

# List all questions
npm run admin -- list-questions

# Associate an existing question with a topic
npm run admin -- add-question-to-topic -q question_id -t topic_id
```

Each command supports the `--help` flag for more information:
```bash
npm run admin -- --help
npm run admin -- create-topic --help
npm run admin -- create-question --help
```

Remember: When passing arguments to the admin script through npm, you need to add `--` before the arguments.
