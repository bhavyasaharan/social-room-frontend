import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { ArrowLeft, Globe, Lock } from 'lucide-react';
import api from '../../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profilePicture: '',
    privacy: 'PUBLIC',
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    fetchProfile();
    hasFetched.current = true;
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile/me');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        bio: response.data.bio || '',
        profilePicture: response.data.profilePicture || '',
        privacy: response.data.privacy?.name || 'PUBLIC',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/profile/me', {
        name: formData.name,
        bio: formData.bio,
        profilePicture: formData.profilePicture,
        privacy: formData.privacy,
      });
      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const isPrivate = profile?.privacy?.name === 'PRIVATE';

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/rooms')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600" />

        {/* Profile Header */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 sm:-mt-12">
            {/* Profile Picture */}
            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-blue-100">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-blue-600">
                  {profile?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile?.name || 'User'}</h1>
                </div>
                <Button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </div>

          {/* Privacy Badge */}
          <div className="mt-4 flex items-center space-x-2">
            {isPrivate ? (
              <div className="flex items-center text-gray-600">
                <Lock className="h-4 w-4 mr-1" />
                <span className="text-sm">Private Profile</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <Globe className="h-4 w-4 mr-1" />
                <span className="text-sm">Public Profile</span>
              </div>
            )}
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                  placeholder="https://example.com/profile-picture.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Privacy
                </label>
                <select
                  name="privacy"
                  value={formData.privacy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}

          {/* Profile Details */}
          {!isEditing && (
            <div className="mt-6 space-y-4">
              {profile?.name && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Name</h3>
                  <p className="text-gray-600">{profile.name}</p>
                </div>
              )}

              {profile?.bio && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-gray-600">{profile.bio}</p>
                </div>
              )}

              {profile?.posts && profile.posts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Posts</h3>
                  <div className="space-y-2">
                    {profile.posts.map((post) => (
                      <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">{post.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
