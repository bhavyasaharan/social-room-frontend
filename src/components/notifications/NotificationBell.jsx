import { useState } from 'react';
import { Bell } from 'lucide-react';

import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const {
    unreadCount
  } = useNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="relative rounded-full p-2 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={22} />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-0.5
              -top-0.5
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-red-500
              px-1
              text-xs
              font-semibold
              text-white
            "
          >
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;