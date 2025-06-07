import { POST } from '@/app/api/telegram/webhook/route';
import { prisma } from '@/lib/prisma';
import Head from 'next/head';
import { NextRequest } from 'next/server';

const originalFetch = global.fetch;
const headers = {
  'Content-Type': 'application/json',
  'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_WEBHOOK_SECRET,
};

describe('Telegram Webhook', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.user.deleteMany();

  });

  afterAll(async () => {
    // Clean up and close Prisma connection
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    global.fetch = originalFetch;
  });

  it('should create a new user when receiving a message', async () => {

    global.fetch = jest.fn((url, init) => {
      const body = JSON.parse(init.body);
      expect(body.text).toContain("You said: Hello, bot!");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    }) as jest.Mock;

    const mockTelegramMessage = {
      message: {
        message_id: 1,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
        },
        chat: {
          id: 123456789,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Hello, bot!',
      },
    };

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(mockTelegramMessage),
      headers: headers
    });

    // Call the webhook handler
    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify the user was created in the database
    const user = await prisma.user.findUnique({
      where: { telegramId: 123456789 },
    });

    expect(user).toBeTruthy();
    expect(user?.telegramId).toBe(BigInt(123456789));
    expect(user?.username).toBe('johndoe');
    expect(user?.firstName).toBe('John');
    expect(user?.lastName).toBe('Doe');
    expect(user?.isActive).toBe(true);

    expect((await prisma.user.findMany()).length).toBe(1);
  });

  it('should respond with intro to /start command without creating a user', async () => {

    global.fetch = jest.fn((url, init) => {
      expect(url).toContain("/sendMessage");
      expect(init.method).toBe("POST");
      expect(init.headers['Content-Type']).toBe("application/json");
      const body = JSON.parse(init.body);
      expect(body.chat_id).toBe("123456789");
      expect(body.text).toContain("Welcome");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    }) as jest.Mock;

    const startCommand = {
      message: {
        message_id: 1,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
        },
        chat: {
          id: 123456789,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
      },
    };
    const webhookRequest = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(startCommand),
      headers: headers,
    });

    const webhookResponse = await POST(webhookRequest);
    expect(webhookResponse.status).toBe(200);

    // Verify no user was created
    const users = await prisma.user.findMany();
    expect(users.length).toBe(0);
  });
});
