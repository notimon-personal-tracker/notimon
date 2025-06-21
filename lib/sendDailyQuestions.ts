import { prisma } from './prisma';
import { sendMessage } from './telegram';
import { sendWhatsappMessage } from './whatsapp';
import { Channel, Question, User, UserQuestionPreference } from '../prisma/generated/prisma';

async function sendDailyQuestions() {
  try {
    // Get all active questions with user preferences
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      include: {
        preferences: {
          where: { isEnabled: true },
          include: {
            user: {
              include: {
                channels: {
                  where: { isEnabled: true },
                },
              },
            },
          },
        },
      },
    });

    // For each question, send to users who have opted in
    for (const question of questions) {
      const optionsText = question.options
        .map((opt: string, idx: number) => `${idx + 1}. ${opt}`)
        .join('\n');
      
      const messageText = `${question.text}\n\n${optionsText}\n\nPlease reply with the number of your choice.`;

      // Send to each user on their active channels
      for (const pref of question.preferences) {
        if (pref.user.isActive) {
          for (const channel of pref.user.channels) {
            try {
              if (channel.channel === Channel.TELEGRAM) {
                await sendMessage(BigInt(channel.channelUserId), messageText);
                console.log(`Sent question to user ${pref.user.id} on Telegram`);
              } else if (channel.channel === Channel.WHATSAPP) {
                await sendWhatsappMessage(channel.channelUserId, messageText);
                console.log(`Sent question to user ${pref.user.id} on WhatsApp`);
              }
            } catch (error) {
              console.error(`Failed to send question to user ${pref.user.id} on channel ${channel.channel}:`, error);
            }
          }
        }
      }
    }

    console.log('Finished sending daily questions');
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

export { sendDailyQuestions }; 