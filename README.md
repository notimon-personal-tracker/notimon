# Notimon

A quantified self app to help you track anything about yourself.


## How it works

It can be helpful to have time series data to understand health and wellbeing issues. It can be hard to remember to fill in the information needed to build up data like this.

The idea with notimon is to get notifications periodically to help you collect the data regardless of your schedule. To make it as effortless as possible, notimon sends multiple choice questions, and all the data is collected as answers to these questions.


## Design

- A user can be connected to one or more messaging services which support multiple choice question/answer messages - these provide the notifications so we don't have to implement that. 
- A user signs up simply by sending a message to the service using their chosen messaging platform
- Once a day we start the messaging sequence. A messaging sequence is sending a question, and once you answer a question, sending the next question, until all your questions for the day have been sent. The next day a new sequence starts.


### Messaging service specifics

#### Facebook

Facebook only allows ad-hoc messages from a bot (notimon) to a user if the user has sent a message to the bot in the past 24 hours. Facebook does allow a pre-approved template message to be sent otherwise. So we start the sequence with facebook by sending an approved template message asking the user if it's ok to send the day's messages. If the user responds yes, we proceed with the questions.


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
curl -F "url=https://your-domain.com/api/telegram/webhook" -F "secret_token=..." https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

### Setting up the WhatsApp Webhook

To set up the WhatsApp webhook, you need to configure it in the Meta for Developers App Dashboard.

1.  Navigate to your App > **WhatsApp** > **Configuration**.
2.  In the "Webhook" section, click "Edit".
3.  Set the "Callback URL" to `https://your-domain.com/api/whatsapp/webhook`.
4.  Enter your `WHATSAPP_VERIFY_TOKEN` value in the "Verify token" field.
5.  Subscribe to the `messages` field.

This process is described in more detail in [WhatsApp's documentation](https://business.whatsapp.com/blog/how-to-use-webhooks-from-whatsapp-business-api).

### Environment Variables

- `DATABASE_URL` e.g. `postgresql://postgres:postgres@localhost:5432/notimon`
- `TELEGRAM_BOT_TOKEN`: Token used to authenticate with telegram bot API
- `TELEGRAM_WEBHOOK_SECRET`: A secret token to be sent in a header "X-Telegram-Bot-Api-Secret-Token" in every webhook request, 1-256 characters. Only characters A-Z, a-z, 0-9, _ and - are allowed. The header is useful to ensure that the request comes from a webhook set by you.
- `WHATSAPP_WEBHOOK_TOKEN`: A secret token used to verify the webhook URL with WhatsApp.
- `FACEBOOK_APP_SECRET`: The Facebook app secret used to authenticate updates from Facebook.

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
