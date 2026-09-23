import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Plus, Edit, Trash2, Lock, Globe } from 'lucide-react';
import api from '../../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let mediaUrls = [];
      if (selectedFile) {
        const uploadedUrl = await handleUploadImage(selectedFile);
        mediaUrls = [{
          mediaUrl: uploadedUrl,
          mediaType: 'IMAGE'
        }];
      }

      await api.post('/posts', {
        caption,
        privacy: privacy === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
        media: mediaUrls
      });
      setCaption('');
      setPrivacy('PUBLIC');
      setSelectedFile(null);
      setPreviewUrl(null);
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
              Image
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
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

const PostCard = ({ post, onUpdate, onDelete, isOwner }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let mediaUrls = [];
      if (selectedFile) {
        const uploadedUrl = await handleUploadImage(selectedFile);
        mediaUrls = [{
          mediaUrl: uploadedUrl,
          mediaType: 'IMAGE'
        }];
      } else if (post.media && post.media.length > 0) {
        mediaUrls = post.media;
      }
      await api.put(`/posts/${post.id}`, {
        caption,
        privacy: post.privacy,
        media: mediaUrls
      });
      onUpdate();
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setLoading(true);
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete();
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Card className="mb-4">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {post.authorUsername?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{post.authorUsername || 'User'}</h3>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {post.privacy === 'PRIVATE' ? (
              <Lock className="h-4 w-4 text-gray-500" />
            ) : (
              <Globe className="h-4 w-4 text-gray-500" />
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-500 hover:text-blue-600"
                  disabled={loading}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-600"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              maxLength={5000}
            />
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="flex items-center justify-center w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
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
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove new image
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setCaption(post.caption);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </Card>
  );
};

const PostsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const hasFetched = useRef(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/feed?page=0&size=20');
      setPosts(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPosts();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Feed</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwner={false}
              onUpdate={fetchPosts}
              onDelete={fetchPosts}
            />
          ))
        )}
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={fetchPosts}
      />
    </div>
  );
};

export default PostsPage;
