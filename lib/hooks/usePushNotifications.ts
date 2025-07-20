'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
  error: string | null;
}

export function usePushNotifications() {
  const { data: session } = useSession();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default',
    error: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          error: 'Push notifications are not supported in this browser' 
        }));
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setState(prev => ({ 
          ...prev, 
          isSupported: true,
          isSubscribed: !!subscription,
          permission: Notification.permission 
        }));
      } catch (error) {
        console.error('Error checking push notification support:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to check push notification support' 
        }));
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw new Error('Failed to request permission');
    }
  }, [state.isSupported]);

  const subscribe = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    if (!state.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission if not granted
      let permission = state.permission;
      if (permission === 'default') {
        permission = await requestPermission();
      }

      if (permission !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // Get VAPID public key
      const vapidResponse = await fetch('/api/user/push-notifications/vapid-key');
      if (!vapidResponse.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const subscribeResponse = await fetch('/api/user/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription');
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        isLoading: false, 
        permission 
      }));

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to subscribe' 
      }));
      throw error;
    }
  }, [session?.user?.id, state.isSupported, state.permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/user/push-notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to unsubscribe' 
      }));
      throw error;
    }
  }, [session?.user?.id]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 