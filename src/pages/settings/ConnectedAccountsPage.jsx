import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Link as LinkIcon } from 'lucide-react';
import api from '../../services/api';

const ConnectedAccountsPage = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /*
   * Check the real Google connection status
   * from the backend when the page loads.
   */
  useEffect(() => {
    const fetchGoogleConnectionStatus = async () => {
      try {
        const response = await api.get('/auth/google/status');

        setIsGoogleConnected(response.data.connected);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          'Unable to load Google connection status.'
        );
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchGoogleConnectionStatus();
  }, []);

  /*
   * Initialize Google Identity Services.
   */
  useEffect(() => {
    if (isLoadingStatus || isGoogleConnected) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 250,
        }
      );

      setIsGoogleReady(true);
    };

    if (window.google) {
      initializeGoogle();
      return;
    }

    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        initializeGoogle();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoadingStatus, isGoogleConnected]);

  /*
   * Google credential received from Google Identity Services.
   */
  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      setError('Google authentication failed.');
      return;
    }

    setIsConnecting(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/google/link', {
        credential: response.credential,
      });

      setIsGoogleConnected(true);

      setMessage(
        'Google account connected successfully.'
      );
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        setError(
          error.response?.data?.message ||
          'This Google account is already connected.'
        );
      } else if (status === 401) {
        setError(
          error.response?.data?.message ||
          'Your session or Google credentials are invalid.'
        );
      } else {
        setError(
          error.response?.data?.message ||
          'Unable to connect Google account.'
        );
      }
    } finally {
      setIsConnecting(false);
    }
  };

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
          Connected Accounts
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        {/* Google */}
        <div className="p-5">

          <div className="flex items-center justify-between">

            <div className="flex items-center">

              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <LinkIcon className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <p className="font-medium text-gray-900">
                  Google
                </p>

                <p className="text-sm text-gray-500">
                  Connect your Google account to Social Room
                </p>
              </div>

            </div>

            {/* Connection status */}
            {isLoadingStatus ? (
              <div className="text-sm text-gray-500">
                Checking...
              </div>
            ) : isGoogleConnected ? (
              <div className="flex items-center text-sm text-green-600">
                <Check className="h-4 w-4 mr-1" />
                Connected
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300 mr-2" />
                Not connected
              </div>
            )}

          </div>

          {/* Connect Google */}
          {!isLoadingStatus && !isGoogleConnected && (
            <div className="mt-5">

              {isConnecting && (
                <p className="text-sm text-gray-500 mb-3">
                  Connecting Google account...
                </p>
              )}

              {!isGoogleReady && !isConnecting && (
                <p className="text-sm text-gray-500 mb-3">
                  Loading Google...
                </p>
              )}

              <div ref={googleButtonRef} />

            </div>
          )}

          {/* Success message */}
          {message && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* Error message */}
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

export default ConnectedAccountsPage;