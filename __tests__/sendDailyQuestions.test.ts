import { prisma } from '@/lib/prisma';
import { sendMessage, sendMessageWithKeyboard } from '@/lib/telegram';
import { sendWhatsappMessage, sendWhatsappTemplate, sendWhatsappInteractiveMessage } from '@/lib/whatsapp';
import { sendDailyQuestions } from '@/lib/sendDailyQuestions';
import { Channel } from '@/prisma/generated/prisma';

// Mock the transport functions
jest.mock('@/lib/telegram', () => ({
  sendMessage: jest.fn(),
  sendMessageWithKeyboard: jest.fn(),
}));
jest.mock('@/lib/whatsapp', () => ({
  sendWhatsappMessage: jest.fn(),
  sendWhatsappTemplate: jest.fn(),
  sendWhatsappInteractiveMessage: jest.fn(),
}));

describe('sendDailyQuestions', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.answer.deleteMany();
    await prisma.userQuestionPreference.deleteMany();
    await prisma.dailyQuestionSequence.deleteMany();
    await prisma.question.deleteMany();
    await prisma.userChannel.deleteMany();
    await prisma.user.deleteMany();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sends start sequence messages - first question for Telegram, template for WhatsApp', async () => {
    const telegramId = 123456789n;
    const whatsappId = '447123456789';
    
    // Create a test user with both channels
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        isActive: true,
        channels: {
          create: [
            {
              channel: Channel.TELEGRAM,
              channelUserId: telegramId.toString(),
            },
            {
              channel: Channel.WHATSAPP,
              channelUserId: whatsappId,
            },
          ],
        },
      },
    });

    // Create a test question
    const question = await prisma.question.create({
      data: {
        text: 'How are you feeling today?',
        options: ['Great', 'Good', 'Okay', 'Not great'],
        isActive: true,
      },
    });

    // Subscribe the user to the question
    await prisma.userQuestionPreference.create({
      data: {
        userId: user.id,
        questionId: question.id,
        isEnabled: true,
      },
    });

    // Run the daily questions function
    await sendDailyQuestions();

    // Verify that Telegram received the first question with keyboard
    expect(sendMessageWithKeyboard).toHaveBeenCalledTimes(1);
    expect(sendMessageWithKeyboard).toHaveBeenCalledWith(
      telegramId,
      'How are you feeling today?',
      ['Great', 'Good', 'Okay', 'Not great']
    );

    // Verify that WhatsApp received the template
    expect(sendWhatsappTemplate).toHaveBeenCalledTimes(1);
    expect(sendWhatsappTemplate).toHaveBeenCalledWith(
      whatsappId,
      'start_conversation'
    );

    // Verify that regular messages were not sent
    expect(sendMessage).not.toHaveBeenCalled();
    expect(sendWhatsappMessage).not.toHaveBeenCalled();
    expect(sendWhatsappInteractiveMessage).not.toHaveBeenCalled();
  });

  it('sends only the first subscribed question initially', async () => {
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

    // Create three test questions sequentially to ensure proper ordering
    const question1 = await prisma.question.create({
      data: {
        text: 'Question 1?',
        options: ['Yes', 'No', 'Maybe'],
        isActive: true,
      },
    });
    
    const question2 = await prisma.question.create({
      data: {
        text: 'Question 2?',
        options: ['Red', 'Blue', 'Green'],
        isActive: true,
      },
    });
    
    const question3 = await prisma.question.create({
      data: {
        text: 'Question 3?',
        options: ['Apple', 'Banana', 'Orange'],
        isActive: true,
      },
    });

    // Subscribe the user to only two questions
    await Promise.all([
      prisma.userQuestionPreference.create({
        data: {
          userId: user.id,
          questionId: question1.id,
          isEnabled: true,
        },
      }),
      prisma.userQuestionPreference.create({
        data: {
          userId: user.id,
          questionId: question2.id,
          isEnabled: true,
        },
      }),
    ]);

    // Run the daily questions function
    await sendDailyQuestions();

    // Verify that sendMessageWithKeyboard was called exactly once (only the first question)
    expect(sendMessageWithKeyboard).toHaveBeenCalledTimes(1);
    expect(sendWhatsappMessage).not.toHaveBeenCalled();

    // Verify the content of the first message
    expect(sendMessageWithKeyboard).toHaveBeenCalledWith(
      telegramId,
      'Question 1?',
      ['Yes', 'No', 'Maybe']
    );

    // Verify that other functions were not called
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('sends start sequence to a user with multiple channels', async () => {
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

    // Verify that Telegram received the first question with keyboard
    expect(sendMessageWithKeyboard).toHaveBeenCalledTimes(1);
    expect(sendMessageWithKeyboard).toHaveBeenCalledWith(
      telegramId,
      'Multi-channel question?',
      ['A', 'B']
    );

    // Verify that WhatsApp received the template (not the question text)
    expect(sendWhatsappTemplate).toHaveBeenCalledTimes(1);
    expect(sendWhatsappTemplate).toHaveBeenCalledWith(
      whatsappId,
      'start_conversation'
    );

    // Verify that regular messages were not sent
    expect(sendMessage).not.toHaveBeenCalled();
    expect(sendWhatsappMessage).not.toHaveBeenCalled();
    expect(sendWhatsappInteractiveMessage).not.toHaveBeenCalled();
  });
}); 