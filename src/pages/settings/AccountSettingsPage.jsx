import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Link,
  ChevronRight,
} from 'lucide-react';

const AccountSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-4">

      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-bold ml-3">
          Account
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        {/* Username */}
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Username
              </p>

              <p className="text-sm text-gray-500">
                Manage your username
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Email */}
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Email
              </p>

              <p className="text-sm text-gray-500">
                Manage your email address
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Phone */}
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Phone
              </p>

              <p className="text-sm text-gray-500">
                Manage your phone number
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Connected Accounts */}
        <button
          onClick={() => navigate('/settings/account/connected-accounts')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center">
            <Link className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Connected Accounts
              </p>

              <p className="text-sm text-gray-500">
                Manage Google and other connected accounts
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* Password */}
<button
  onClick={() => navigate('/settings/account/password')}
  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
>
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-gray-600 mr-4" />

            <div className="text-left">
              <p className="font-medium text-gray-900">
                Password
              </p>

              <p className="text-sm text-gray-500">
                Change or manage your password
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

      </div>
    </div>
  );
};

export default AccountSettingsPage;