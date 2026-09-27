import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose }) => {
  const {
    notifications,
    loading,
    unreadCount
  } = useNotifications();

  return (
    <div
      className="
        absolute
        right-0
        top-12
        z-50
        w-96
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        bg-white
        shadow-xl
      "
    >
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-gray-200
          px-4
          py-3
        "
      >
        <h2 className="font-semibold text-gray-900">
          Notifications
        </h2>

        {unreadCount > 0 && (
          <span className="text-xs text-gray-500">
            {unreadCount}{' '}
            {unreadCount === 1
              ? 'unread'
              : 'unread'}
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[450px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="font-medium">
              No notifications
            </p>

            <p className="mt-1 text-sm">
              You're all caught up.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onClose}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;