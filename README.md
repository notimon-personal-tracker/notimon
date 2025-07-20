# Notimon

A quantified self app to help you track anything about yourself.


## How it works

It can be helpful to have time series data to understand health and wellbeing issues. It can be hard to remember to fill in the information needed to build up data like this.

The idea with notimon is to get notifications periodically to help you collect the data regardless of your schedule. To make it as effortless as possible, notimon shows multiple choice questions. You can answer any number of the questions you have time for by selecting the most fitting option.

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

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Deployment


### Environment Variables

- `NEXTAUTH_SECRET` `your-super-secret-jwt-secret-here-replace-with-random-string`
- `NEXTAUTH_URL` e.g. `http://localhost:3000`
- `DATABASE_URL` e.g. `postgresql://postgres:postgres@localhost:5432/notimon`

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

## Push Notifications

Notimon supports web push notifications for Chrome and Safari on iOS. When the `send-questions` command runs, users who have:
1. Subscribed to at least one question
2. Enabled push notifications

Will receive a notification saying "Time to fill in your answers!"

### Quick Setup

1. Generate VAPID keys:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

2. Add environment variables to `.env.local`:
```env
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
```

3. Users can enable push notifications in their Account page

For detailed setup instructions including Safari iOS support, see [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md).

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
