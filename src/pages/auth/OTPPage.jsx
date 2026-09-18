import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';

const OTPPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';
  
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [formData, setFormData] = useState({
    phone: phone,
    otp: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: formData.phone });
      setOtpSent(true);
      setStep('verify');
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to send OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        phone: formData.phone,
        otp: formData.otp,
      });
      
      if (response.data.user) {
        login(response.data.user, response.data.token);
        navigate('/rooms');
      } else {
        // New user, redirect to registration with phone
        navigate('/register', { state: { phone: formData.phone } });
      }
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Invalid OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {step === 'request' ? 'Login with Phone' : 'Verify OTP'}
        </h1>
        
        {step === 'request' ? (
          <form onSubmit={handleRequestOTP}>
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+1234567890"
              required
            />
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                OTP sent to {formData.phone}
              </p>
            </div>
            
            <Input
              label="Enter OTP"
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              error={errors.otp}
              placeholder="123456"
              required
            />
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            
            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full mt-4 text-sm text-blue-600 hover:underline"
            >
              Change phone number
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Prefer email?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login with email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
