import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { UserPlus, UserMinus, Check, X, MoreVertical, Search } from 'lucide-react';
import api from '../../services/api';

const FriendsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, sent, search
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    fetchData();
    hasFetched.current = true;
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'friends':
          response = await api.get('/friends');
          setFriends(response.data.content || response.data);
          break;
        case 'requests':
          response = await api.get('/friends/requests?direction=INCOMING');
          setRequests(response.data);
          break;
        case 'sent':
          response = await api.get('/friends/requests?direction=OUTGOING');
          setSentRequests(response.data);
          break;
        case 'search':
          if (searchQuery.trim()) {
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

  return (
    <div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'friends' && friends.map((friend) => (
            <Card key={friend.userId}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {friend.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">@{friend.username}</h3>
                </div>
                <div className="flex space-x-2">
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
  );
};

export default FriendsPage;
