import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [queryClient]);

  // Show toast for new notifications
  useEffect(() => {
    if (!notifications.length) return;

    const latestNotification = notifications[0];
    
    // Only show toast for new notifications
    if (lastNotificationId === null) {
      setLastNotificationId(latestNotification.id);
      return;
    }

    if (latestNotification.id > lastNotificationId) {
      // New notification received!
      toast.info(latestNotification.title, {
        description: latestNotification.message,
        duration: 5000,
      });
      setLastNotificationId(latestNotification.id);
    }
  }, [notifications, lastNotificationId]);

  // Request notification permission and subscribe to push
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      console.log("Service workers are not supported");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            "BP6QOmZWCPfmtZ8EGjBQN9cF8wJKvPfXRZp8S8a2QPVX7VJMn7F8h0jKvPfXRZp8S8a2QPVX7VJMn7F8h0jK" // Replace with your VAPID public key
          )
        });

        // Send subscription to server
        const response = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
              auth: arrayBufferToBase64(subscription.getKey("auth"))
            }
          })
        });

        if (response.ok) {
          toast.success("Push notifications enabled!");
          return true;
        }
      } else {
        toast.error("Notification permission denied");
        return false;
      }
    } catch (error) {
      console.error("Error setting up push notifications:", error);
      toast.error("Failed to enable push notifications");
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    requestPermission,
  };
}

// Helper functions for push subscription
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
