import { prisma } from './prisma';
import { sendPushNotificationToUsers, NotificationPayload } from './pushNotifications';

/**
 * Send daily questions - sends push notifications to users with enabled preferences
 */
async function sendDailyQuestions() {
  try {
    console.log('Starting to send daily questions...');
    
    // Get all active users with their channels and push subscriptions
    const users = await prisma.user.findMany({
      include: {
        preferences: {
          where: { isEnabled: true },
          include: {
            question: true,
          },
        },
        pushSubscriptions: {
          where: { isEnabled: true },
        },
      },
    });

    console.log(`Found ${users.length} total users`);

    // Filter users who have both subscribed questions AND push notification subscriptions
    const eligibleUsers = users.filter(user => 
      user.preferences.length > 0 && user.pushSubscriptions.length > 0
    );

    console.log(`Found ${eligibleUsers.length} users eligible for push notifications`);

    if (eligibleUsers.length === 0) {
      console.log('No users to send notifications to');
      return;
    }

    // Create the notification payload
    const notificationPayload: NotificationPayload = {
      title: 'Notimon',
      body: 'Time to fill in your answers!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: '/questions',
      tag: 'notimon-daily-questions',
    };

    // Extract user IDs
    const userIds = eligibleUsers.map(user => user.id);

    // Send push notifications to all eligible users
    const result = await sendPushNotificationToUsers(userIds, notificationPayload);

    console.log(`Push notification results:
      - Total notifications sent: ${result.sent}
      - Total failures: ${result.failed}
      - Users reached: ${result.usersSent}/${eligibleUsers.length}
    `);

    // Log individual user stats for debugging
    eligibleUsers.forEach(user => {
      console.log(`User ${user.email}: ${user.preferences.length} subscribed questions, ${user.pushSubscriptions.length} push subscriptions`);
    });

  } catch (error) {
    console.error('Error sending daily questions:', error);
    throw error;
  }
}

// If this script is run directly (not imported as a module)
if (require.main === module) {
  sendDailyQuestions()
    .then(() => {
      console.log('Successfully completed sending daily questions');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { sendDailyQuestions }; 