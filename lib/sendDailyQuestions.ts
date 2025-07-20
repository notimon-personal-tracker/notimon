import { prisma } from './prisma';
import { sendMessage, sendMessageWithKeyboard } from './telegram';
import { sendWhatsappMessage, sendWhatsappTemplate, sendWhatsappInteractiveMessage } from './whatsapp';
import { Channel, Question, User, UserQuestionPreference } from '../prisma/generated/prisma';
import { createUserFsm, serializeFsm } from './userFsm';

/**
 * Get the next unsent subscribed question for a user on a given date
 */
async function getNextUnsentQuestion(userId: string, date: Date = new Date()): Promise<Question | null> {
  // Normalize date to start of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Get all subscribed questions for the user
  const subscribedQuestions = await prisma.question.findMany({
    where: {
      isActive: true,
      preferences: {
        some: {
          userId: userId,
          isEnabled: true,
        },
      },
    },
    include: {
      dailyQuestions: {
        where: {
          userId: userId,
          date: startOfDay,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // Ensure consistent ordering
    },
  });

  // Find the first question that hasn't been sent today
  const unsentQuestion = subscribedQuestions.find(
    question => question.dailyQuestions.length === 0
  );

  return unsentQuestion || null;
}

/**
 * Mark a question as sent for a user on a given date
 */
async function markQuestionAsSent(userId: string, questionId: string, date: Date = new Date()): Promise<void> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  await prisma.dailyQuestionSequence.upsert({
    where: {
      userId_questionId_date: {
        userId,
        questionId,
        date: startOfDay,
      },
    },
    create: {
      userId,
      questionId,
      date: startOfDay,
    },
    update: {
      sentAt: new Date(),
    },
  });
}

/**
 * Send the next question in the sequence to a user
 */
async function sendNextQuestionToUser(userId: string, channelType: Channel, channelUserId: string): Promise<boolean> {
  const nextQuestion = await getNextUnsentQuestion(userId);
  
  if (!nextQuestion) {
    // No more questions for today
    return false;
  }

  try {
    if (channelType === Channel.TELEGRAM) {
      await sendMessageWithKeyboard(BigInt(channelUserId), nextQuestion.text, nextQuestion.options);
    } else if (channelType === Channel.WHATSAPP) {
      await sendWhatsappInteractiveMessage(channelUserId, nextQuestion.text, nextQuestion.options);
    }

    // Mark the question as sent
    await markQuestionAsSent(userId, nextQuestion.id);
    console.log(`Sent question ${nextQuestion.id} to user ${userId} on ${channelType}`);
    return true;
  } catch (error) {
    console.error(`Failed to send question to user ${userId} on channel ${channelType}:`, error);
    return false;
  }
}

/**
 * Send daily questions - only sends the start sequence message
 */
async function sendDailyQuestions() {
  try {
    // Get all active users with their channels
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        channels: {
          where: { isEnabled: true },
        },
        preferences: {
          where: { isEnabled: true },
          include: {
            question: true,
          },
        },
      },
    });

    for (const user of users) {
      // Skip users with no subscribed questions
      if (user.preferences.length === 0) {
        continue;
      }

      // Check if user has any unsent questions for today
      const nextQuestion = await getNextUnsentQuestion(user.id);
      if (!nextQuestion) {
        console.log(`No unsent questions for user ${user.id} today`);
        continue;
      }

      // Initialize or update user FSM state
      const fsm = createUserFsm(user.fsmState || 'idle');
      // The FSM starts automatically, no need to trigger start_day manually
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fsmState: serializeFsm(fsm),
        },
      });

      // Send start sequence message on each channel
      for (const channel of user.channels) {
        try {
          if (channel.channel === Channel.WHATSAPP) {
            // For WhatsApp, send the start_conversation template
            await sendWhatsappTemplate(channel.channelUserId, 'start_conversation');
            console.log(`Sent start_conversation template to user ${user.id} on WhatsApp`);
          } else {
            // For other channels (Telegram), send the first question directly
            const sent = await sendNextQuestionToUser(user.id, channel.channel, channel.channelUserId);
            if (sent) {
              console.log(`Sent first question to user ${user.id} on ${channel.channel}`);
            }
          }
        } catch (error) {
          console.error(`Failed to send start sequence to user ${user.id} on channel ${channel.channel}:`, error);
        }
      }
    }

    console.log('Finished sending daily question start sequences');
  } catch (error) {
    console.error('Error sending daily questions:', error);
  }
}

// If this script is run directly (not imported as a module)
if (require.main === module) {
  sendDailyQuestions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { sendDailyQuestions, sendNextQuestionToUser, getNextUnsentQuestion }; 