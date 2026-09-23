import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const googleButtonRef = useRef(null);

  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: handleGoogleLogin,
    });

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        theme: 'outline',
        size: 'large',
        width: 350,
        text: 'continue_with',
      }
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setErrors(prev => ({
      ...prev,
      [name]: '',
      submit: '',
    }));
  };

  const validate = () => {
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);

      login(
        {
          id: response.data.userId,
          username: response.data.username,
        },
        response.data.token
      );

      navigate('/rooms');

    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          'Login failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  async function handleGoogleLogin(response) {
    if (!response?.credential) {
      setErrors({
        submit: 'Google login failed. Please try again.',
      });

      return;
    }

    setGoogleLoading(true);
    setErrors({});

    try {
      const result = await api.post('/auth/google/login', {
        credential: response.credential,
      });

      login(
        {
          id: result.data.userId,
          username: result.data.username,
        },
        result.data.token
      );

      navigate('/rooms');

    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.message ||
          'Google login failed. Please try again.',
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">

        <h1 className="text-2xl font-bold text-center mb-6">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit}>

          <Input
            label="Email or Username"
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            error={errors.login}
            placeholder="Enter your email or username"
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
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

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
            disabled={loading || googleLoading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>

        <div className="mt-4">

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <div ref={googleButtonRef}></div>
          </div>

          {googleLoading && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Logging in with Google...
            </p>
          )}

        </div>

      </div>
    </div>
  );
};

export default LoginPage;