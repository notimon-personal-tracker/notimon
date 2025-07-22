import webpush from 'web-push';
import { SNSClient, CreatePlatformApplicationCommand, CreatePlatformEndpointCommand, PublishCommand } from '@aws-sdk/client-sns';
import { getPrisma } from './prisma';

// Configure web-push
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Configure AWS SNS
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Save a push subscription to the database
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription,
  userAgent?: string
): Promise<void> {
  try {
    const prisma = getPrisma();
    await prisma.pushNotificationSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        isEnabled: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        isEnabled: true,
      },
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
}

/**
 * Get all active push subscriptions for a user
 */
export async function getUserPushSubscriptions(userId: string) {
  const prisma = getPrisma();
  return await prisma.pushNotificationSubscription.findMany({
    where: {
      userId,
      isEnabled: true,
    },
  });
}

/**
 * Delete a push subscription
 */
export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.pushNotificationSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });
}

/**
 * Send push notification using web-push (for Chrome and other browsers)
 */
export async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      url: payload.url || '/',
      tag: payload.tag || 'notimon',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Questions',
          icon: '/icon-192x192.png'
        }
      ]
    });

    await webpush.sendNotification(subscription, notificationPayload);
  } catch (error) {
    console.error('Error sending web push notification:', error);
    throw error;
  }
}

/**
 * Send push notification using AWS SNS (for Safari on iOS and other platforms)
 */
export async function sendSNSPushNotification(
  endpoint: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    // For Safari, we need to use the APNS format
    const apnsPayload = {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: 'default',
        badge: 1,
        'url-args': [payload.url || '/'],
      },
    };

    const message = {
      default: payload.body,
      APNS: JSON.stringify(apnsPayload),
      APNS_SANDBOX: JSON.stringify(apnsPayload),
    };

    const publishCommand = new PublishCommand({
      TargetArn: endpoint,
      Message: JSON.stringify(message),
      MessageStructure: 'json',
    });

    await snsClient.send(publishCommand);
  } catch (error) {
    console.error('Error sending SNS push notification:', error);
    throw error;
  }
}

/**
 * Detect browser type from user agent
 */
export function getBrowserType(userAgent?: string): 'chrome' | 'safari' | 'firefox' | 'other' {
  if (!userAgent) return 'other';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    return 'chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'safari';
  } else if (userAgent.includes('Firefox')) {
    return 'firefox';
  }
  
  return 'other';
}

/**
 * Send push notification to a user (tries both web-push and SNS based on browser)
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getUserPushSubscriptions(userId);
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      const browserType = getBrowserType(subscription.userAgent || undefined);
      const webPushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      if (browserType === 'safari' || subscription.endpoint.includes('apple')) {
        // Use SNS for Safari/iOS
        await sendSNSPushNotification(subscription.endpoint, payload);
      } else {
        // Use web-push for Chrome and other browsers
        await sendWebPushNotification(webPushSubscription, payload);
      }
      
      sent++;
    } catch (error) {
      console.error(`Failed to send push notification to user ${userId}:`, error);
      
      // If the subscription is invalid, disable it
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
        const prisma = getPrisma();
        await prisma.pushNotificationSubscription.update({
          where: { id: subscription.id },
          data: { isEnabled: false },
        });
      }
      
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send push notifications to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number; usersSent: number }> {
  let totalSent = 0;
  let totalFailed = 0;
  let usersSent = 0;

  for (const userId of userIds) {
    try {
      const result = await sendPushNotificationToUser(userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
      
      if (result.sent > 0) {
        usersSent++;
      }
    } catch (error) {
      console.error(`Failed to send push notification to user ${userId}:`, error);
      totalFailed++;
    }
  }

  return {
    sent: totalSent,
    failed: totalFailed,
    usersSent,
  };
} 