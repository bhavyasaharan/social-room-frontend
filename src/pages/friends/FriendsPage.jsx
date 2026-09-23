import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Header from '../../components/layout/Header';
import { UserPlus, UserMinus, Check, X, MoreVertical, Search, MessageCircle, X as CloseIcon, LayoutGrid } from 'lucide-react';
import api from '../../services/api';

const FriendProfileView = ({ friend, onClose, onMessage }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gridLayout, setGridLayout] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const hasFetchedProfile = useRef(false);

  const handleGridLayoutChange = () => {
    setGridLayout(prev => prev >= 4 ? 1 : prev + 1);
  };

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
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const isPrivate = profile?.privacy?.name === 'PRIVATE';

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-gray-300 bg-white shadow-sm" style={{ minHeight: '64px', flexShrink: 0 }}>
        <h2 className="text-xl font-semibold">Profile</h2>
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
        <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4" />

        {/* Profile Header */}
        <div className="flex items-start mb-6">
          <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-purple-100 shrink-0">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-purple-600">
                {profile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1">{profile?.name || 'User'}</h1>
        <p className="text-gray-600 mb-4">@{friend.username}</p>

        {/* Privacy Badge */}
        <div className="flex items-center space-x-2 mb-6">
          {isPrivate ? (
            <div className="flex items-center text-gray-600">
              <MoreVertical className="h-4 w-4 mr-1" />
              <span className="text-sm">Private Profile</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-600">
              <Search className="h-4 w-4 mr-1" />
              <span className="text-sm">Public Profile</span>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="space-y-4">
          {profile?.bio && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}

          {profile?.posts && profile.posts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Posts</h3>
                <button
                  onClick={handleGridLayoutChange}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  title={`${gridLayout} rows`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="text-sm font-medium">{gridLayout}</span>
                </button>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridLayout}, 1fr)` }}>
                {profile.posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {post.media && post.media.length > 0 ? (
                      <div className="aspect-video bg-gray-100">
                        {post.media[0].mediaType === 'IMAGE' && (
                          <img
                            src={post.media[0].mediaUrl}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No media</span>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="max-w-4xl w-full max-h-full overflow-auto bg-white rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
              {selectedPost.media && selectedPost.media.length > 0 ? (
                <div className="w-full">
                  {selectedPost.media[0].mediaType === 'IMAGE' && (
                    <img
                      src={selectedPost.media[0].mediaUrl}
                      alt="Post"
                      className="w-full max-h-[70vh] object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No media</span>
                </div>
              )}
              <div className="p-6">
                <p className="text-gray-800 text-lg mb-3">{selectedPost.caption}</p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedPost.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FriendsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  console.log('FriendsPage rendering, user:', user);

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
      hasFetched.current = false;
      fetchData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.put(`/friends/requests/${requestId}/reject`);
      hasFetched.current = false;
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.put(`/friends/requests/${requestId}/cancel`);
      hasFetched.current = false;
      fetchData();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      await api.delete(`/friends/${friendId}`);
      hasFetched.current = false;
      fetchData();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!confirm('Are you sure you want to block this user?')) return;
    
    try {
      await api.post(`/blocks/${userId}`);
      hasFetched.current = false;
      fetchData();
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    try {
      await api.post('/friends/requests', { receiverId });
      hasFetched.current = false;
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
    <div className="flex flex-col h-screen bg-gray-50" style={{ paddingTop: '64px' }}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Friends List */}
        <div className={`flex-1 ${selectedFriend ? 'w-1/2' : 'w-full'} transition-all duration-300 overflow-y-auto`}>
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Friends</h1>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeTab === 'friends' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('friends');
                  hasFetched.current = false;
                }}
              >
                Friends ({friends.length})
              </Button>
              <Button
                variant={activeTab === 'requests' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('requests');
                  hasFetched.current = false;
                }}
              >
                Requests ({requests.length})
              </Button>
              <Button
                variant={activeTab === 'sent' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('sent');
                  hasFetched.current = false;
                }}
              >
                Sent ({sentRequests.length})
              </Button>
              <Button
                variant={activeTab === 'search' ? 'primary' : 'outline'}
                onClick={() => {
                  setActiveTab('search');
                  hasFetched.current = false;
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit">Search</Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'friends' && friends.map((friend) => (
                <Card
                  key={friend.userId}
                  onClick={() => setSelectedFriend(friend)}
                  className={`cursor-pointer transition-colors ${selectedFriend?.userId === friend.userId ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">@{friend.username}</h3>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRemoveFriend(friend.userId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleBlockUser(friend.userId)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              {activeTab === 'requests' && requests.map((request) => (
                <Card key={request.requestUserId}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {request.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">@{request.username}</h3>
                      <p className="text-sm text-gray-600">Status: {request.status}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.requestUserId)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.requestUserId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}

              {activeTab === 'sent' && sentRequests.map((request) => (
                <Card key={request.requestUserId}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {request.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">@{request.username}</h3>
                      <p className="text-sm text-gray-600">Status: {request.status}</p>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(request.requestUserId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
              ))}

              {activeTab === 'search' && searchResults.map((user) => (
                <Card key={user.userId}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">@{user.username}</h3>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(user.userId)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'friends' && friends.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No friends yet. Join rooms to meet people!</p>
            </div>
          )}

          {activeTab === 'requests' && requests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No pending requests.</p>
            </div>
          )}

          {activeTab === 'sent' && sentRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No sent requests.</p>
            </div>
          )}

          {activeTab === 'search' && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching "{searchQuery}"</p>
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
