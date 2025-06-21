import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram';
import { sendWhatsappMessage } from '@/lib/whatsapp';
import { sendDailyQuestions } from '@/lib/sendDailyQuestions';
import { Channel } from '@/prisma/generated/prisma';

// Mock the transport functions
jest.mock('@/lib/telegram', () => ({
  sendMessage: jest.fn(),
}));
jest.mock('@/lib/whatsapp', () => ({
  sendWhatsappMessage: jest.fn(),
}));

describe('sendDailyQuestions', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.answer.deleteMany();
    await prisma.userQuestionPreference.deleteMany();
    await prisma.question.deleteMany();
    await prisma.userChannel.deleteMany();
    await prisma.user.deleteMany();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sends only subscribed questions to users', async () => {
    const telegramId = 123456789n;
    // Create a test user with a Telegram channel
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        isActive: true,
        channels: {
          create: {
            channel: Channel.TELEGRAM,
            channelUserId: telegramId.toString(),
          },
        },
      },
    });

    // Create three test questions
    const questions = await Promise.all([
      prisma.question.create({
        data: {
          text: 'Question 1?',
          options: ['Yes', 'No', 'Maybe'],
          isActive: true,
        },
      }),
      prisma.question.create({
        data: {
          text: 'Question 2?',
          options: ['Red', 'Blue', 'Green'],
          isActive: true,
        },
      }),
      prisma.question.create({
        data: {
          text: 'Question 3?',
          options: ['Apple', 'Banana', 'Orange'],
          isActive: true,
        },
      }),
    ]);

    // Subscribe the user to only two questions
    await Promise.all([
      prisma.userQuestionPreference.create({
        data: {
          userId: user.id,
          questionId: questions[0].id,
          isEnabled: true,
        },
      }),
      prisma.userQuestionPreference.create({
        data: {
          userId: user.id,
          questionId: questions[1].id,
          isEnabled: true,
        },
      }),
    ]);

    // Run the daily questions function
    await sendDailyQuestions();

    // Verify that sendMessage was called exactly twice
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendWhatsappMessage).not.toHaveBeenCalled();

    // Verify the content of the messages
    expect(sendMessage).toHaveBeenCalledWith(
      telegramId,
      expect.stringContaining('Question 1?')
    );
    expect(sendMessage).toHaveBeenCalledWith(
      telegramId,
      expect.stringContaining('Question 2?')
    );

    // Verify that Question 3 was not sent
    expect(sendMessage).not.toHaveBeenCalledWith(
      telegramId,
      expect.stringContaining('Question 3?')
    );

    // Verify the format of the messages
    const calls = (sendMessage as jest.Mock).mock.calls;
    for (const [_, message] of calls) {
      expect(message).toMatch(/\d\. /); // Should contain numbered options
      expect(message).toContain('Please reply with the number of your choice');
    }
  });

  it('sends questions to a user with multiple channels', async () => {
    const telegramId = 123456789n;
    const whatsappId = '447123456789';

    // Create a test user with both Telegram and WhatsApp channels
    const user = await prisma.user.create({
      data: {
        username: 'multichanneluser',
        isActive: true,
        channels: {
          create: [
            { channel: Channel.TELEGRAM, channelUserId: telegramId.toString() },
            { channel: Channel.WHATSAPP, channelUserId: whatsappId },
          ],
        },
      },
    });

    const question = await prisma.question.create({
      data: {
        text: 'Multi-channel question?',
        options: ['A', 'B'],
        isActive: true,
      },
    });

    await prisma.userQuestionPreference.create({
      data: {
        userId: user.id,
        questionId: question.id,
        isEnabled: true,
      },
    });

    await sendDailyQuestions();

    // Verify that both transports were called once
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendWhatsappMessage).toHaveBeenCalledTimes(1);

    // Verify the content of the messages
    expect(sendMessage).toHaveBeenCalledWith(
      telegramId,
      expect.stringContaining('Multi-channel question?')
    );
    expect(sendWhatsappMessage).toHaveBeenCalledWith(
      whatsappId,
      expect.stringContaining('Multi-channel question?')
    );
  });
}); 