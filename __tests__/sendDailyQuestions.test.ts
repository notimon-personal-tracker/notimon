import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram';
import { sendDailyQuestions } from '@/lib/sendDailyQuestions';

// Mock the telegram sendMessage function
jest.mock('@/lib/telegram', () => ({
  sendMessage: jest.fn(),
}));

describe('sendDailyQuestions', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.answer.deleteMany();
    await prisma.userQuestionPreference.deleteMany();
    await prisma.question.deleteMany();
    await prisma.user.deleteMany();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sends only subscribed questions to users', async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        telegramId: 123456789n,
        username: 'testuser',
        isActive: true,
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

    // Verify the content of the messages
    expect(sendMessage).toHaveBeenCalledWith(
      user.telegramId,
      expect.stringContaining('Question 1?')
    );
    expect(sendMessage).toHaveBeenCalledWith(
      user.telegramId,
      expect.stringContaining('Question 2?')
    );

    // Verify that Question 3 was not sent
    expect(sendMessage).not.toHaveBeenCalledWith(
      user.telegramId,
      expect.stringContaining('Question 3?')
    );

    // Verify the format of the messages
    const calls = (sendMessage as jest.Mock).mock.calls;
    for (const [_, message] of calls) {
      expect(message).toMatch(/\d\. /); // Should contain numbered options
      expect(message).toContain('Please reply with the number of your choice');
    }
  });
}); 