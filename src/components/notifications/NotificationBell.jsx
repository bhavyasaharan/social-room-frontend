import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';

import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = ({ menuItem = false, expanded = true }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const buttonRef = useRef(null);

  const {
    unreadCount
  } = useNotifications();

  const toggleNotifications = () => {
    if (open) {
      setOpen(false);
      return;
    }

    if (menuItem && buttonRef.current) {
      const bounds = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = Math.min(384, window.innerWidth - 32);
      let left = bounds.right + 12;

      if (left + dropdownWidth > window.innerWidth - 16) {
        left = bounds.left - dropdownWidth - 12;
      }
      left = Math.max(16, left);

      setDropdownPosition({ left, width: dropdownWidth });
    }

    setOpen(true);
  };

  return (
    <div className={`relative ${menuItem ? 'w-full' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleNotifications}
        title={!expanded ? 'Notifications' : undefined}
        className={menuItem
          ? `relative flex w-full items-center rounded-xl py-3 text-sm font-medium transition-colors ${open ? 'bg-[#C2526A] text-[#121212]' : 'text-[#F5F1E8] hover:bg-[#292521]'} ${expanded ? 'gap-3 px-3' : 'justify-center px-0'}`
          : 'relative rounded-full p-2 text-[#F5F1E8] transition-colors hover:bg-[#292521]'}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} />
        {menuItem && expanded && <span>Notifications</span>}

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
              bg-[#C2526A]
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

      {open && (menuItem
        ? createPortal(
          <NotificationDropdown
            onClose={() => setOpen(false)}
            placement="menu"
            style={dropdownPosition}
          />,
          document.body
        )
        : <NotificationDropdown onClose={() => setOpen(false)} />)}
    </div>
  );
};

export default NotificationBell;