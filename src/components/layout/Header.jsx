
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  House,
  LogOut,
  MessageSquare,
  Shield,
  User,
  Users,
} from 'lucide-react';

import NotificationBell from '../notifications/NotificationBell';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() => {
    const savedState = localStorage.getItem('social-room-sidebar-expanded');
    return savedState === null ? true : savedState === 'true';
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsExpanded((expanded) => {
      localStorage.setItem('social-room-sidebar-expanded', String(!expanded));
      return !expanded;
    });
  };

  const navItems = [
    { to: '/home', label: 'Home', icon: House },
    { to: '/rooms', label: 'Rooms', icon: Users },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/posts', label: 'Feed', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-[#34302C] bg-[#181614] p-3 transition-[width] duration-200 ${
        isExpanded ? 'w-64' : 'w-[4.5rem]'
      }`}
    >
        <div className={`mb-6 flex border-b border-[#34302C] pb-4 ${isExpanded ? 'items-center justify-between' : 'flex-col items-center gap-3'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C2526A] text-[#121212]">
              <Users className="h-5 w-5" />
            </div>
            {isExpanded && <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#A9A198]">Social</p>
              <h2 className="text-lg font-semibold text-[#F5F1E8]">Room</h2>
            </div>}
          </div>

          <button
            type="button"
            aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
            title={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#A9A198] transition-colors hover:bg-[#292521] hover:text-[#F5F1E8]"
          >
            {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {user ? (
            <>
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={!isExpanded ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-sm font-medium transition-colors ${isExpanded ? 'gap-3 px-3' : 'justify-center px-0'} ${
                      isActive ? 'bg-[#C2526A] text-[#121212]' : 'text-[#F5F1E8] hover:bg-[#292521]'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isExpanded && label}
                </NavLink>
              ))}

              {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                <NavLink
                  to="/admin"
                  title={!isExpanded ? 'Admin' : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl py-3 text-sm font-medium text-[#D96565] transition-colors ${isExpanded ? 'gap-3 px-3' : 'justify-center px-0'} ${
                      isActive ? 'bg-[#2B1D1D]' : 'hover:bg-[#292521]'
                    }`
                  }
                >
                  <Shield className="h-5 w-5 shrink-0" />
                  {isExpanded && 'Admin'}
                </NavLink>
              )}

              <div className="border-t border-[#34302C] pt-3">
                <NotificationBell menuItem expanded={isExpanded} />
              </div>

              <div className="mt-4 border-t border-[#34302C] pt-4">
                <div className={`flex items-center rounded-xl bg-[#211E1B] py-3 text-[#F5F1E8] ${isExpanded ? 'justify-start gap-3 px-3' : 'justify-center px-1'}`}>
                  <div className={`flex items-center ${isExpanded ? 'gap-3' : ''}`}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C2526A] text-xs font-bold text-[#121212]">
                      {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    {isExpanded && <div>
                      <p className="text-sm font-semibold">@{user?.username || 'user'}</p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#A9A198]">Online</p>
                    </div>}
                  </div>

                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title={!isExpanded ? 'Logout' : undefined}
                className={`mt-4 flex w-full items-center rounded-xl py-3 text-left text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-[#292521] ${isExpanded ? 'gap-3 px-3' : 'justify-center px-0'}`}
              >
                <LogOut className="h-5 w-5 shrink-0 text-[#D96565]" />
                {isExpanded && 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center justify-center rounded-xl bg-[#C2526A] px-3 py-3 text-sm font-semibold text-[#121212]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center rounded-xl border border-[#34302C] bg-[#211E1B] px-3 py-3 text-sm font-semibold text-[#F5F1E8]"
              >
                Register
              </Link>
            </>
          )}
        </nav>
    </aside>
  );
};

export default Header;