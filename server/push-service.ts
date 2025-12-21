import webPush from 'web-push';
import { IStorage } from './storage';

// VAPID keys configuration
// Generate keys using: npx web-push generate-vapid-keys
// Then set environment variables: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@winkstay.com';

// Only configure web-push if VAPID keys are provided
export const isPushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushEnabled) {
  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY!,
    VAPID_PRIVATE_KEY!
  );
  console.log('Web push notifications enabled');
} else {
  console.log('Web push notifications disabled: VAPID keys not configured. Generate keys with: npx web-push generate-vapid-keys');
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  referenceId?: number | null;
  url?: string;
}

/**
 * Send push notification to a user
 * @param storage Storage instance for database access
 * @param userId User ID to send notification to
 * @param payload Notification payload
 */
export async function sendPushNotification(
  storage: IStorage,
  userId: number,
  payload: NotificationPayload
): Promise<void> {
  try {
    // Get user's push subscriptions
    const subscriptions = await storage.getPushSubscriptions(userId);

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    // Send notification to all user's devices
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.message,
          message: payload.message,
          type: payload.type,
          referenceId: payload.referenceId,
          url: payload.url,
        });

        await webPush.sendNotification(pushSubscription, notificationPayload);
        console.log(`Push notification sent successfully to user ${userId}`);
      } catch (error: any) {
        console.error(`Failed to send push to subscription:`, error.message);
        
        // If subscription is invalid/expired, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription for user ${userId}`);
          await storage.deletePushSubscription(subscription.id);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    // Don't throw - push notifications should fail gracefully
  }
}

/**
 * Send push notification with automatic error handling
 * Safe to call even if VAPID keys are not configured
 */
export async function sendPushNotificationSafe(
  storage: IStorage,
  userId: number,
  payload: NotificationPayload
): Promise<void> {
  // Only attempt to send if VAPID keys are configured
  if (!isPushEnabled) {
    return; // Silently skip if push is not enabled
  }

  await sendPushNotification(storage, userId, payload);
}
