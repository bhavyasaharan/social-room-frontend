import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { UserPlus, UserMinus, Check, X, MoreVertical, Search, MessageCircle, X as CloseIcon, Flag } from 'lucide-react';
import api from '../../services/api';

const FriendProfileView = ({ friend, onClose, onMessage }) => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    if (hasFetchedProfile.current) return;
    fetchProfile();
    hasFetchedProfile.current = true;
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/profile/${friend.userId}`);
      setProfile(response.data);
      fetchPosts();
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await api.get(`/posts/user/${friend.userId}?page=0&size=20`);
      const postsData = Array.isArray(response.data) ? response.data : (response.data.content || []);
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: '#A9A198' }}>Loading profile...</p>
      </div>
    );
  }

  const isPrivate = profile?.privacy?.name === 'PRIVATE';

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#181614', borderLeft: '1px solid #34302C' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ minHeight: '64px', flexShrink: 0, borderBottom: '1px solid #34302C', backgroundColor: '#181614' }}>
        <h2 className="text-xl font-semibold" style={{ color: '#F5F1E8' }}>Profile</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onMessage}
            size="sm"
            variant="outline"
            className="mr-2"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button
            onClick={() => setShowReportModal(true)}
            size="sm"
            variant="outline"
            className="mr-2"
          >
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Cover Image */}
        <div className="h-32 rounded-lg mb-4" style={{ background: 'linear-gradient(to right, #C2526A, #D46B82)' }} />

        {/* Profile Header */}
        <div className="flex items-start mb-6">
          <div className="w-24 h-24 rounded-full border-4 shadow-lg overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: '#292521', borderColor: '#181614' }}>
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold" style={{ color: '#C2526A' }}>
                {profile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: '#F5F1E8' }}>{profile?.name || 'User'}</h1>
        <p className="mb-4" style={{ color: '#A9A198' }}>@{friend.username}</p>

        {/* Privacy Badge */}
        <div className="flex items-center space-x-2 mb-6">
          {isPrivate ? (
            <div className="flex items-center" style={{ color: '#A9A198' }}>
              <MoreVertical className="h-4 w-4 mr-1" />
              <span className="text-sm">Private Profile</span>
            </div>
          ) : (
            <div className="flex items-center" style={{ color: '#A9A198' }}>
              <Search className="h-4 w-4 mr-1" />
              <span className="text-sm">Public Profile</span>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="space-y-4">
          {profile?.bio && (
            <div>
              <h3 className="font-semibold mb-2" style={{ color: '#F5F1E8' }}>Bio</h3>
              <p style={{ color: '#A9A198' }}>{profile.bio}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#F5F1E8' }}>Posts ({posts.length})</h3>
            {postsLoading ? (
              <p style={{ color: '#A9A198' }}>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p style={{ color: '#A9A198' }}>No posts yet.</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="rounded-lg p-4" style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm" style={{ color: '#A9A198' }}>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap mb-3" style={{ color: '#F5F1E8' }}>{post.caption}</p>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#F5F1E8' }}>Report User</h2>
            <ReportModalContent
              targetId={friend.userId}
              targetType="USER"
              onClose={() => setShowReportModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ReportModalContent = ({ targetId, targetType, onClose }) => {
  const [reason, setReason] = useState('HARASSMENT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reports', {
        targetType,
        targetId,
        reason,
        description
      });
      alert('Report submitted successfully');
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="HARASSMENT">Harassment</option>
          <option value="HATE_OR_ABUSE">Hate or Abuse</option>
          <option value="THREATS_OR_VIOLENCE">Threats or Violence</option>
          <option value="SEXUAL_CONTENT">Sexual Content</option>
          <option value="SPAM">Spam</option>
          <option value="SCAM_OR_FRAUD">Scam or Fraud</option>
          <option value="IMPERSONATION">Impersonation</option>
          <option value="PRIVACY_VIOLATION">Privacy Violation</option>
          <option value="ILLEGAL_CONTENT">Illegal Content</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide more details..."
          rows="4"
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </div>
    </form>
  );
};

const FriendsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const lastFetchedTab = useRef(null);

  useEffect(() => {
    console.log('useEffect triggered, activeTab:', activeTab);
    if (lastFetchedTab.current === activeTab) return;
    lastFetchedTab.current = activeTab;
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    console.log('fetchData called, activeTab:', activeTab);
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'friends':
          console.log('Fetching friends...');
          response = await api.get('/friends');
          console.log('Friends response:', response.data);
          setFriends(response.data.content || response.data);
          break;
        case 'requests':
          console.log('Fetching requests...');
          response = await api.get('/friends/requests?direction=INCOMING');
          console.log('Requests response:', response.data);
          setRequests(response.data);
          break;
        case 'sent':
          console.log('Fetching sent requests...');
          response = await api.get('/friends/requests?direction=OUTGOING');
          console.log('Sent requests response:', response.data);
          setSentRequests(response.data);
          break;
        case 'search':
          if (searchQuery.trim()) {
            console.log('Searching users...');
            response = await api.get(`/users/search?query=${searchQuery}`);
            setSearchResults(response.data.content || response.data);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('search');
      setLoading(true);
      try {
        const response = await api.get(`/users/search?query=${searchQuery}`);
        setSearchResults(response.data.content || response.data);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.put(`/friends/requests/${requestId}/accept`);
      lastFetchedTab.current = null;
      fetchData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/friends/requests/${requestId}/reject`);
      lastFetchedTab.current = null;
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.put(`/friends/requests/${requestId}/cancel`);
      lastFetchedTab.current = null;
      fetchData();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      await api.delete(`/friends/${friendId}`);
      lastFetchedTab.current = null;
      fetchData();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!confirm('Are you sure you want to block this user?')) return;

    try {
      await api.post(`/blocks/${userId}`);
      lastFetchedTab.current = null;
      fetchData();
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    try {
      await api.post('/friends/requests', { receiverId });
      lastFetchedTab.current = null;
      fetchData();
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleDirectMessage = async (friend) => {
    try {
      const response = await api.post('/conversations/direct', { otherUserId: friend.userId });
      const convId = response.data.conversationId;
      navigate(`/messages/${convId}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: '#121212' }}>
      <div className="flex flex-1 overflow-hidden pt-4">
        {/* Left Side - Friends List */}
        <div className={`flex-1 ${selectedFriend ? 'w-1/2' : 'w-full'} transition-all duration-300 overflow-y-auto`}>
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#F5F1E8' }}>
              Friends
            </h1>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeTab === 'friends' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('friends');
                  lastFetchedTab.current = null;
                }}
              >
                Friends ({friends.length})
              </Button>
              <Button
                variant={activeTab === 'requests' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('requests');
                  lastFetchedTab.current = null;
                }}
              >
                Requests ({requests.length})
              </Button>
              <Button
                variant={activeTab === 'sent' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('sent');
                  lastFetchedTab.current = null;
                }}
              >
                Sent ({sentRequests.length})
              </Button>
              <Button
                variant={activeTab === 'search' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('search');
                  lastFetchedTab.current = null;
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search Users
              </Button>
            </div>

          {/* Search Bar */}
          {activeTab === 'search' && (
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by username..."
                  className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#211E1B',
                    border: '1px solid #34302C',
                    color: '#F5F1E8'
                  }}
                />
                <Button type="submit">Search</Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: '#A9A198' }}>Loading...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'friends' && friends.map((friend) => (
                <div
                  key={friend.userId}
                  onClick={() => setSelectedFriend(friend)}
                  className={`rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedFriend?.userId === friend.userId
                      ? 'border-rose-700'
                      : 'hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor: '#211E1B',
                    border: selectedFriend?.userId === friend.userId ? '2px solid #C2526A' : '1px solid #34302C'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#292521' }}>
                      <span className="font-medium" style={{ color: '#C2526A' }}>
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#F5F1E8' }}>@{friend.username}</h3>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRemoveFriend(friend.userId)}
                        className="hover:opacity-80"
                        style={{ color: '#D96565' }}
                      >
                        <UserMinus className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleBlockUser(friend.userId)}
                        className="hover:opacity-80"
                        style={{ color: '#A9A198' }}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'requests' && requests.map((request) => (
                <div
                  key={request.requestUserId}
                  onClick={() => setSelectedFriend({ userId: request.requestUserId, username: request.username })}
                  className="rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#292521' }}>
                      <span className="font-medium" style={{ color: '#C2526A' }}>
                        {request.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#F5F1E8' }}>@{request.username}</h3>
                      <p className="text-sm" style={{ color: '#A9A198' }}>Status: {request.status}</p>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleAcceptRequest(request.requestUserId)}
                        className="hover:opacity-80"
                        style={{ color: '#62C174' }}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.requestUserId)}
                        className="hover:opacity-80"
                        style={{ color: '#D96565' }}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'sent' && sentRequests.map((request) => (
                <div
                  key={request.requestUserId}
                  onClick={() => setSelectedFriend({ userId: request.requestUserId, username: request.username })}
                  className="rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#292521' }}>
                      <span className="font-medium" style={{ color: '#C2526A' }}>
                        {request.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#F5F1E8' }}>@{request.username}</h3>
                      <p className="text-sm" style={{ color: '#A9A198' }}>Status: {request.status}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancelRequest(request.requestUserId); }}
                      className="hover:opacity-80"
                      style={{ color: '#D96565' }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {activeTab === 'search' && searchResults.map((user) => (
                <div
                  key={user.userId}
                  onClick={() => setSelectedFriend({ userId: user.userId, username: user.username })}
                  className="rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#292521' }}>
                      <span className="font-medium" style={{ color: '#C2526A' }}>
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#F5F1E8' }}>@{user.username}</h3>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendFriendRequest(user.userId); }}
                      className="hover:opacity-80"
                      style={{ color: '#C2526A' }}
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

            </div>
          )}

          {activeTab === 'friends' && friends.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: '#A9A198' }}>No friends yet. Join rooms to meet people!</p>
            </div>
          )}

          {activeTab === 'requests' && requests.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: '#A9A198' }}>No pending requests.</p>
            </div>
          )}

          {activeTab === 'sent' && sentRequests.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: '#A9A198' }}>No sent requests.</p>
            </div>
          )}

          {activeTab === 'search' && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p style={{ color: '#A9A198' }}>No users found matching "{searchQuery}"</p>
            </div>
          )}

        </div>
      </div>

      {/* Right Side - Friend Profile */}
      {selectedFriend && (
        <div className="w-1/2 h-full transition-all duration-300">
          <FriendProfileView
            key={selectedFriend.userId}
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
            onMessage={() => handleDirectMessage(selectedFriend)}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default FriendsPage;
