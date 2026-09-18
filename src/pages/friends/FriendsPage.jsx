import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { UserPlus, UserMinus, Check, X, MoreVertical } from 'lucide-react';
import api from '../../services/api';

const FriendsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, sent
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'friends':
          response = await api.get('/friends');
          setFriends(response.data);
          break;
        case 'requests':
          response = await api.get('/friends/requests');
          setRequests(response.data);
          break;
        case 'sent':
          response = await api.get('/friends/requests/sent');
          setSentRequests(response.data);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/friends/requests/${requestId}/accept`);
      fetchData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/friends/requests/${requestId}/reject`);
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.delete(`/friends/requests/${requestId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      await api.delete(`/friends/${friendId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!confirm('Are you sure you want to block this user?')) return;
    
    try {
      await api.post(`/users/${userId}/block`);
      fetchData();
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Friends</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'friends' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({requests.length})
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentRequests.length})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'friends' && friends.map((friend) => (
            <Card key={friend.id}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {friend.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">@{friend.username}</h3>
                  <p className="text-sm text-gray-600">{friend.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleBlockUser(friend.id)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {activeTab === 'requests' && requests.map((request) => (
            <Card key={request.id}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {request.sender.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">@{request.sender.username}</h3>
                  <p className="text-sm text-gray-600">{request.sender.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {activeTab === 'sent' && sentRequests.map((request) => (
            <Card key={request.id}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {request.receiver.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">@{request.receiver.username}</h3>
                  <p className="text-sm text-gray-600">{request.receiver.name}</p>
                </div>
                <button
                  onClick={() => handleCancelRequest(request.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
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
    </div>
  );
};

export default FriendsPage;
