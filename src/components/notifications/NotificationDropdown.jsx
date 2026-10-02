import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose, placement = 'default', style }) => {
  const {
    notifications,
    loading,
    unreadCount
  } = useNotifications();
  const isMenuPlacement = placement === 'menu';

  return (
    <div
      className={`${isMenuPlacement ? 'fixed inset-y-3 flex flex-col' : 'absolute right-0 top-12'} z-[100] w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#34302C] bg-[#181614] shadow-xl`}
      style={style}
    >
      {/* Header */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-[#34302C]
          px-4
          py-3
        "
      >
        <h2 className="font-semibold text-[#F5F1E8]">
          Notifications
        </h2>

        {unreadCount > 0 && (
          <span className="text-xs text-[#A9A198]">
            {unreadCount}{' '}
            {unreadCount === 1
              ? 'unread'
              : 'unread'}
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className={isMenuPlacement ? 'min-h-0 flex-1 overflow-y-auto' : 'max-h-[450px] overflow-y-auto'}>
        {loading ? (
          <div className="p-6 text-center text-[#A9A198]">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-[#A9A198]">
            <p className="font-medium text-[#F5F1E8]">
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