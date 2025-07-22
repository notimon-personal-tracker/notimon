import webpush from 'web-push';
import { getPrisma } from './prisma';


function getRequestOptions(): webpush.RequestOptions {
  return {
    vapidDetails: {
      subject: `mailto:${process.env.VAPID_CONTACT}`,
      publicKey: process.env.VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!,
    },
  }
}

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
  const options: webpush.RequestOptions = getRequestOptions();
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

    await webpush.sendNotification(subscription, notificationPayload, options);
  } catch (error) {
    console.error('Error sending web push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to a user
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
      const webPushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      await sendWebPushNotification(webPushSubscription, payload);
      
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