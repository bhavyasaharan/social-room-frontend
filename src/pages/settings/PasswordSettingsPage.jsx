import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import api from '../../services/api';

const PasswordSettingsPage = () => {
  const navigate = useNavigate();

  const [passwordSet, setPasswordSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPasswordStatus = async () => {
      try {
        const response = await api.get('/auth/password/status');

        setPasswordSet(response.data.passwordSet);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'Unable to load password settings.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasswordStatus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setIsSaving(true);

    try {
      await api.put('/auth/password', {
        currentPassword: passwordSet
          ? currentPassword
          : null,
        newPassword,
        confirmPassword,
      });

      setMessage(
        passwordSet
          ? 'Password changed successfully.'
          : 'Password set successfully.'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setPasswordSet(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Unable to update password.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-500">
          Loading password settings...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">

      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/settings/account')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-bold ml-3">
          Password
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">

        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
            <Lock className="h-5 w-5 text-gray-600" />
          </div>

          <div>
            <h2 className="font-medium text-gray-900">
              {passwordSet
                ? 'Change Password'
                : 'Set Password'}
            </h2>

            <p className="text-sm text-gray-500">
              {passwordSet
                ? 'Update your Social Room password.'
                : 'Set a password so you can also log in without Google.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Current password */}
          {passwordSet && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          {/* New password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
              minLength={8}
              maxLength={100}
              required
            />
          </div>

          {/* Confirm password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
              required
            />
          </div>

          {/* Success */}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving
              ? 'Saving...'
              : passwordSet
                ? 'Change Password'
                : 'Set Password'}
          </button>

        </form>

      </div>
    </div>
  );
};

export default PasswordSettingsPage;