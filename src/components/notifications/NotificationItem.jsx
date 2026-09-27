import {
  UserPlus,
  Bell
} from 'lucide-react';

import { useNotifications } from '../../context/NotificationContext';

const NotificationItem = ({
  notification,
  onClose
}) => {
  const {
    markAsRead
  } = useNotifications();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    onClose?.();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'FRIEND_REQUEST_RECEIVED':
        return <UserPlus size={20} />;

      default:
        return <Bell size={20} />;
    }
  };

  const getMessage = () => {
    switch (notification.type) {
      case 'FRIEND_REQUEST_RECEIVED':
        return (
          <>
            <span className="font-semibold">
              {notification.actorUsername}
            </span>{' '}
            sent you a friend request.
          </>
        );

      default:
        return (
          <>
            <span className="font-semibold">
              {notification.actorUsername}
            </span>{' '}
            sent you a notification.
          </>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        flex
        w-full
        gap-3
        border-b
        px-4
        py-3
        text-left
        transition
        hover:bg-gray-50
        ${
          !notification.read
            ? 'bg-blue-50'
            : 'bg-white'
        }
      `}
    >
      {/* Icon */}

      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-gray-100
          text-gray-600
        "
      >
        {getIcon()}
      </div>

      {/* Content */}

      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700">
          {getMessage()}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {new Date(
            notification.createdAt
          ).toLocaleString()}
        </p>
      </div>

      {/* Unread indicator */}

      {!notification.read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
      )}
    </button>
  );
};

export default NotificationItem;