import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import { useAuth } from './AuthContext';
import webSocketService from '../services/webSocketService';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /*
   * Load existing notifications.
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoading(true);

        const data =
          await notificationService.getNotifications();

        // Backend returns Spring Page<NotificationResponse>
        setNotifications(data.content || []);

        const count =
          await notificationService.getUnreadCount();

        setUnreadCount(count);
      } catch (error) {
        console.error(
          'Failed to load notifications:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user, authLoading]);

  /*
   * Subscribe to real-time notifications.
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let mounted = true;

    const subscribe = async () => {
      try {
        await webSocketService.connect();

        if (!mounted) {
          return;
        }

        webSocketService.subscribe(
          '/user/queue/notifications',
          (notification) => {
            console.log(
              'Notification received:',
              notification
            );

            if (!mounted) {
              return;
            }

            setNotifications((previous) => [
              notification,
              ...previous
            ]);

            setUnreadCount((previous) => previous + 1);
          }
        );
      } catch (error) {
        console.error(
          'Notification WebSocket failed:',
          error
        );
      }
    };

    subscribe();

    return () => {
      mounted = false;

      webSocketService.unsubscribe(
        '/user/queue/notifications'
      );
    };
  }, [user, authLoading]);

  /*
   * Mark a single notification as read.
   */
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(
        notificationId
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        Math.max(previous - 1, 0)
      );
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider'
    );
  }

  return context;
};