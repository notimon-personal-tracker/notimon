import { prisma } from './prisma';


/**
 * Send daily questions - only sends the start sequence message
 */
async function sendDailyQuestions() {
  try {
    // Get all active users with their channels
    const users = await prisma.user.findMany({
      include: {
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
    }
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