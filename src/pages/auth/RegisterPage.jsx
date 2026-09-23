import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    is18Plus: false,
  });

  const [googleCredential, setGoogleCredential] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      googleButtonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
        }
      );

      return true;
    };

    if (initializeGoogle()) {
      return;
    }

    const interval = setInterval(() => {
      if (initializeGoogle()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleResponse = (response) => {
    if (!response?.credential) {
      setErrors({
        submit: 'Google authentication failed. Please try again.',
      });
      return;
    }

    setGoogleCredential(response.credential);

    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setErrors(prev => ({
      ...prev,
      [name]: '',
      submit: '',
    }));
  };

  const validateNormalRegistration = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.is18Plus) {
      newErrors.is18Plus =
        'You must confirm that you are 18 or older';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validateGoogleRegistration = () => {
    const newErrors = {};

    if (!googleCredential) {
      newErrors.submit =
        'Please continue with Google first.';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.is18Plus) {
      newErrors.is18Plus =
        'You must confirm that you are 18 or older';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateNormalRegistration()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
      });

      navigate('/login');
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          'Registration failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();

    if (!validateGoogleRegistration()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/google/register', {
        credential: googleCredential,
        username: formData.username,
      });

      navigate('/login');
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          'Google registration failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const googleRegistrationStarted = !!googleCredential;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">

        <h1 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h1>

        {!googleRegistrationStarted ? (
          <>
            <div className="flex justify-center mb-6">
              <div ref={googleButtonRef}></div>
            </div>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>

              <span className="px-4 text-sm text-gray-500">
                OR
              </span>

              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleSubmit}>

              <Input
                label="Email"
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
                required
                autoComplete="off"
              />

              <Input
                label="Phone Number"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="Enter your phone number"
                required
                autoComplete="off"
              />

              <Input
                label="Username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                placeholder="Choose a username"
                required
                autoComplete="off"
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Create a password"
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is18Plus"
                    checked={formData.is18Plus}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />

                  <span className="ml-2 text-sm text-gray-700">
                    I confirm that I am 18 years or older
                  </span>
                </label>

                {errors.is18Plus && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.is18Plus}
                  </p>
                )}
              </div>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    {errors.submit}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Register'}
              </Button>

            </form>
          </>
        ) : (
          <form onSubmit={handleGoogleSubmit}>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Google authentication successful.
              </p>

              <p className="font-medium mt-1">
                Choose your Social Room username.
              </p>
            </div>

            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="Choose a username"
              required
              autoComplete="off"
            />

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is18Plus"
                  checked={formData.is18Plus}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />

                <span className="ml-2 text-sm text-gray-700">
                  I confirm that I am 18 years or older
                </span>
              </label>

              {errors.is18Plus && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.is18Plus}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {errors.submit}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? 'Creating account...'
                : 'Create account with Google'}
            </Button>

          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;