    import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Check,
} from 'lucide-react';
import api from '../../services/api';

const PrivacySettingsPage = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/me');

        setProfile(response.data);
        setSelectedPrivacy(response.data.privacy);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'Unable to load privacy settings.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePrivacyChange = async (privacy) => {
    if (!profile || privacy === selectedPrivacy) {
      return;
    }

    setSelectedPrivacy(privacy);
    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const response = await api.put('/profile/me', {
        name: profile.name,
        bio: profile.bio,
        profilePicture: profile.profilePicture,
        privacy,
      });

      setProfile(response.data);
      setSelectedPrivacy(response.data.privacy);

      setMessage('Profile privacy updated successfully.');
    } catch (error) {
      setSelectedPrivacy(profile.privacy);

      setError(
        error.response?.data?.message ||
        'Unable to update profile privacy.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-500">
          Loading privacy settings...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-bold ml-3">
          Privacy
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
              <Shield className="h-5 w-5 text-gray-600" />
            </div>

            <div>
              <h2 className="font-medium text-gray-900">
                Profile Privacy
              </h2>

              <p className="text-sm text-gray-500">
                Control who can view your profile.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handlePrivacyChange('PUBLIC')}
            className={`w-full flex items-center justify-between p-4 rounded-lg border mb-3 text-left transition-colors ${
              selectedPrivacy === 'PUBLIC'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div>
              <p className="font-medium text-gray-900">
                Public
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Anyone can view your profile.
              </p>
            </div>

            {selectedPrivacy === 'PUBLIC' && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handlePrivacyChange('PRIVATE')}
            className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${
              selectedPrivacy === 'PRIVATE'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div>
              <p className="font-medium text-gray-900">
                Private
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Only you and your friends can view your profile.
              </p>
            </div>

            {selectedPrivacy === 'PRIVATE' && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </button>

          {isSaving && (
            <p className="mt-4 text-sm text-gray-500">
              Saving privacy settings...
            </p>
          )}

          {message && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;