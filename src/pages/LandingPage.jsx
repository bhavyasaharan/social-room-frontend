import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Shield, Zap } from 'lucide-react';
import Button from '../components/common/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Social Room Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover temporary public rooms, join them, meet new people, and participate in shared activities.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <Button size="large">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="large">Login</Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <Users className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Temporary Rooms</h3>
            <p className="text-gray-600">
              Create and join temporary rooms for real-time interactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">
              Instant messaging with people in your rooms
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <Shield className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Privacy Controls</h3>
            <p className="text-gray-600">
              Control who can see your profile and join your rooms
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <Zap className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fast & Simple</h3>
            <p className="text-gray-600">
              Easy to use, no complicated setup required
            </p>
          </div>
        </div>

        {/* 18+ Warning */}
        <div className="mt-20 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            ⚠️ This platform is 18+ only. By using this platform, you confirm that you are 18 years or older.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
