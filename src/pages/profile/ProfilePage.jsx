import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { ArrowLeft, Globe, Lock, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
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
  const [posts, setPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const lastFetchedId = useRef(null);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const currentTarget = userId || 'me';
    if (lastFetchedId.current === currentTarget) return;
    lastFetchedId.current = currentTarget;
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (isOwnProfile) {
      fetchPosts();
    }
  }, [isOwnProfile]);

  useEffect(() => {
    console.log('Posts state:', posts);
    console.log('Posts loading:', postsLoading);
    console.log('Is own profile:', isOwnProfile);
  }, [posts, postsLoading, isOwnProfile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const endpoint = isOwnProfile ? '/profile/me' : `/profile/${userId}`;
      console.log('Fetching profile from:', endpoint, 'isOwnProfile:', isOwnProfile, 'userId:', userId);
      const response = await api.get(endpoint);
      console.log('Profile response:', response.data);
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

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await api.get('/posts/me?page=0&size=20');
      console.log('Posts response:', response.data);
      const postsData = Array.isArray(response.data) ? response.data : (response.data.content || []);
      console.log('Posts data extracted:', postsData);
      setPosts(postsData);
      console.log('Posts set to:', postsData);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreatePost = async (caption, privacy, media) => {
    try {
      await api.post('/posts', {
        caption,
        privacy: privacy === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
        media: media
      });
      fetchPosts();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleUpdatePost = async (postId, caption, privacy, media) => {
    try {
      await api.put(`/posts/${postId}`, {
        caption,
        privacy,
        media
      });
      fetchPosts();
      setShowUpdateModal(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const isPrivate = profile?.privacy?.name === 'PRIVATE';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CreatePostModal = ({ isOpen, onClose, onCreate }) => {
    const [caption, setCaption] = useState('');
    const [privacy, setPrivacy] = useState('PUBLIC');
    const [media, setMedia] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    };

    const handleUploadImage = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    };

    const handleRemoveMedia = (index) => {
      setMedia(media.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        let mediaUrls = [...media];
        if (selectedFile) {
          const uploadedUrl = await handleUploadImage(selectedFile);
          mediaUrls = [{
            mediaUrl: uploadedUrl,
            mediaType: 'IMAGE'
          }];
        }
        await onCreate(caption, privacy, mediaUrls);
        setCaption('');
        setPrivacy('PUBLIC');
        setMedia([]);
        setSelectedFile(null);
        setPreviewUrl(null);
      } catch (error) {
        console.error('Failed to create post:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Create Post</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="What's on your mind?"
                maxLength={5000}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="profile-file-input"
                />
                <label
                  htmlFor="profile-file-input"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-gray-600">
                    {selectedFile ? selectedFile.name : 'Click to select an image'}
                  </span>
                </label>
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const UpdatePostModal = ({ isOpen, onClose, post, onUpdate }) => {
    const [caption, setCaption] = useState(post?.caption || '');
    const [privacy, setPrivacy] = useState(post?.privacy || 'PUBLIC');
    const [media, setMedia] = useState(post?.media || []);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    };

    const handleUploadImage = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    };

    const handleRemoveMedia = (index) => {
      setMedia(media.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        let mediaUrls = [...media];
        if (selectedFile) {
          const uploadedUrl = await handleUploadImage(selectedFile);
          mediaUrls = [{
            mediaUrl: uploadedUrl,
            mediaType: 'IMAGE'
          }];
        }
        await onUpdate(post.id, caption, privacy, mediaUrls);
        setCaption('');
        setPrivacy('PUBLIC');
        setMedia([]);
        setSelectedFile(null);
        setPreviewUrl(null);
      } catch (error) {
        console.error('Failed to update post:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Update Post</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="What's on your mind?"
                maxLength={5000}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Image (optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="edit-file-input"
                />
                <label
                  htmlFor="edit-file-input"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-gray-600">
                    {selectedFile ? selectedFile.name : 'Click to select a new image'}
                  </span>
                </label>
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove new image
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate(isOwnProfile ? '/rooms' : '/friends')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {isOwnProfile ? 'Back to Home' : 'Back to Friends'}
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
                  {isOwnProfile && (
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => navigate('/settings')}
                      >
                        Settings
                      </Button>
                    </div>
                  )}
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

              {isOwnProfile && (
                <div>
                  {console.log('Rendering posts section, posts:', posts, 'loading:', postsLoading, 'length:', posts.length)}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900">My Posts ({posts.length})</h3>
                    <Button size="sm" onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Post
                    </Button>
                  </div>
                  {postsLoading ? (
                    <p className="text-gray-500">Loading posts...</p>
                  ) : posts.length === 0 ? (
                    <p className="text-gray-500">No posts yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {posts.map((post) => (
                        <Card key={post.id} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingPost(post);
                                  setShowUpdateModal(true);
                                }}
                                className="text-gray-500 hover:text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.caption}</p>
                          {post.media && post.media.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {post.media.map((mediaItem, index) => (
                                <div key={index}>
                                  {mediaItem.mediaType === 'IMAGE' && (
                                    <img
                                      src={mediaItem.mediaUrl}
                                      alt="Post media"
                                      className="w-full rounded-lg max-h-96 object-cover"
                                    />
                                  )}
                                  {mediaItem.mediaType === 'VIDEO' && (
                                    <video
                                      src={mediaItem.mediaUrl}
                                      controls
                                      className="w-full rounded-lg max-h-96"
                                    />
                                  )}
                                  {mediaItem.mediaType === 'AUDIO' && (
                                    <audio
                                      src={mediaItem.mediaUrl}
                                      controls
                                      className="w-full"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            {post.privacy === 'PRIVATE' ? (
                              <Lock className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Globe className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePost}
      />
      <UpdatePostModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setEditingPost(null);
        }}
        post={editingPost}
        onUpdate={handleUpdatePost}
      />
    </div>
  );
};

export default ProfilePage;
