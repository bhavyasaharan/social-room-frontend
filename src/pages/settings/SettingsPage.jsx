import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Ban,
  Bell,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-bold ml-3">
          Settings
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        {/* Account */}
        <button
          onClick={() => navigate('/settings/account')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Account
              </p>

              <p className="text-sm text-gray-500">
                Manage your account and connected accounts
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Privacy */}
        <button
          onClick={() => navigate('/settings/privacy')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Privacy
              </p>

              <p className="text-sm text-gray-500">
                Control your profile and messaging privacy
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Blocked Users */}
        <button
          onClick={() => navigate('/settings/blocked-users')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Ban className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Blocked Users
              </p>

              <p className="text-sm text-gray-500">
                Manage users you have blocked
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/settings/notifications')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Notifications
              </p>

              <p className="text-sm text-gray-500">
                Manage notification preferences
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* About */}
        <button
          onClick={() => navigate('/settings/about')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Info className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                About
              </p>

              <p className="text-sm text-gray-500">
                About Social Room
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-red-600"
        >
          <LogOut className="h-5 w-5 mr-4" />

          <div className="text-left">
            <p className="font-medium">
              Logout
            </p>

            <p className="text-sm text-red-400">
              Sign out of your Social Room account
            </p>
          </div>
        </button>

      </div>
    </div>
  );
};

export default SettingsPage;