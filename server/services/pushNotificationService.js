/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 * Sends push notifications via Firebase Cloud Messaging
 *
 * NOTE: This requires Firebase Admin SDK to be initialized.
 * Install: npm install firebase-admin
 * Then initialize with your Firebase service account credentials.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let admin = null;
let messaging = null;

/**
 * Initialize Firebase Admin SDK
 * Call this once when server starts
 */
async function initializeFirebaseAdmin() {
  try {
    // Lazy load firebase-admin
    const firebaseAdmin = await import("firebase-admin");

    // Check if already initialized
    if (firebaseAdmin.apps.length > 0) {
      admin = firebaseAdmin.apps[0];
      messaging = admin.messaging();
      console.log("✅ Firebase Admin SDK already initialized");
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const fullPath = path.resolve(
        __dirname,
        "..",
        serviceAccountPath.replace(/^\.\//, "")
      );
      const serviceAccountJson = fs.readFileSync(fullPath, "utf8");
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
    }
    else {
      admin = firebaseAdmin.initializeApp();
    }

    messaging = admin.messaging();
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    console.warn(
      "⚠️ Push notifications will not work until Firebase Admin is configured"
    );
  }
}

/**
 * Send FCM push notification to a single token
 * @param {string} fcmToken - FCM token from device
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {boolean} - Success status
 */
export const sendFCMPushNotification = async (
  fcmToken,
  title,
  body,
  data = {}
) => {
  if (!fcmToken) {
    console.warn("[FCM] No FCM token provided");
    return false;
  }

  if (!admin || !messaging) {
    await initializeFirebaseAdmin();
  }

  if (!messaging) {
    console.error("[FCM] Firebase Admin SDK not initialized");
    return false;
  }

  try {
    const dataPayload = {};
    for (const [key, value] of Object.entries(data)) {
      dataPayload[key] =
        typeof value === "string" ? value : JSON.stringify(value);
    }

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: dataPayload,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    await messaging.send(message);
    console.log(
      `✅ [FCM] Sent notification to ${fcmToken.substring(0, 20)}...`
    );
    return true;
  } catch (error) {
    // Handle specific FCM errors
    if (error.code === "messaging/invalid-registration-token") {
      console.warn(`⚠️ [FCM] Invalid token: ${fcmToken.substring(0, 20)}...`);
      // Token is invalid - should be removed from database
    } else if (error.code === "messaging/registration-token-not-registered") {
      console.warn(
        `⚠️ [FCM] Token not registered: ${fcmToken.substring(0, 20)}...`
      );
      // Token is no longer valid - should be removed from database
    } else {
      console.error(`❌ [FCM] Error sending notification:`, error.message);
    }
    return false;
  }
};

/**
 * Send FCM push notification to multiple tokens
 * @param {string[]} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {object} - { success: number, failed: number }
 */
export const sendFCMPushNotifications = async (
  fcmTokens,
  title,
  body,
  data = {}
) => {
  if (!fcmTokens || fcmTokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  // Filter out invalid tokens
  const validTokens = fcmTokens.filter(
    (t) => t && typeof t === "string" && t.length > 0
  );

  if (validTokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  // Initialize Firebase Admin if not already done
  if (!admin || !messaging) {
    await initializeFirebaseAdmin();
  }

  if (!messaging) {
    console.error("[FCM] Firebase Admin SDK not initialized");
    return { success: 0, failed: validTokens.length };
  }

  try {
    // Convert data object values to strings (FCM requirement)
    const dataPayload = {};
    for (const [key, value] of Object.entries(data)) {
      dataPayload[key] =
        typeof value === "string" ? value : JSON.stringify(value);
    }

    const messages = validTokens.map((token) => ({
      token,
      notification: {
        title,
        body,
      },
      data: dataPayload,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
    }));

    // Use sendAll for batch sending (more efficient)
    const response = await messaging.sendAll(messages);

    const success = response.successCount;
    const failed = response.failureCount;

    console.log(`📱 [FCM] Sent ${success}/${validTokens.length} notifications`);

    // Log failures for debugging
    if (failed > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(
            `⚠️ [FCM] Failed to send to ${validTokens[idx].substring(
              0,
              20
            )}...:`,
            resp.error?.message
          );
        }
      });
    }

    return { success, failed };
  } catch (error) {
    console.error(`❌ [FCM] Batch error:`, error.message);
    return { success: 0, failed: validTokens.length };
  }
};

// Keep old Expo functions for backward compatibility (deprecated)
export const sendExpoPushNotification = async () => {
  console.warn(
    "[PUSH] sendExpoPushNotification is deprecated - use FCM instead"
  );
  return false;
};

export const sendExpoPushNotifications = async () => {
  console.warn(
    "[PUSH] sendExpoPushNotifications is deprecated - use FCM instead"
  );
  return { success: 0, failed: 0 };
};
