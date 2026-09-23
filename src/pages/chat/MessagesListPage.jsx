import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import { MessageSquare } from 'lucide-react';
import api from '../../services/api';

const MessagesListPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    fetchConversations();
    hasFetched.current = true;
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/conversations');
      setConversations(response.data.content || response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (participants) => {
    if (!participants || participants.length === 0) return null;
    return participants.find(p => p.userId !== currentUser?.id) || participants[0];
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No conversations yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Add friends to start messaging!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation.participants);
            if (!otherParticipant) return null;

            return (
              <Card
                key={conversation.conversationId}
                onClick={() => navigate(`/messages/${conversation.conversationId}`)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {otherParticipant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">@{otherParticipant.username}</h3>
                    {conversation.name && (
                      <p className="text-sm text-gray-600">{conversation.name}</p>
                    )}
                    {conversation.updatedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagesListPage;
