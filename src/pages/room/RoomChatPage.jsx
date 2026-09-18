import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, Users, Crown, Shield, LogOut, MoreVertical } from 'lucide-react';
import { WS_BASE_URL } from '../../config/constants';
import api from '../../services/api';

const RoomChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRoomDetails();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoomDetails = async () => {
    try {
      const [roomRes, membersRes] = await Promise.all([
        api.get(`/rooms/${roomId}`),
        api.get(`/rooms/${roomId}/members`)
      ]);
      
      setRoom(roomRes.data);
      setMembers(membersRes.data);
      setIsLeader(roomRes.data.leader?.id === user?.id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      navigate('/rooms');
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    wsRef.current = new WebSocket(`${WS_BASE_URL}/rooms/${roomId}?token=${token}`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'CHAT_MESSAGE':
          setMessages(prev => [...prev, data.payload]);
          break;
        case 'MEMBER_JOINED':
          setMembers(prev => [...prev, data.payload]);
          break;
        case 'MEMBER_LEFT':
          setMembers(prev => prev.filter(m => m.id !== data.payload.id));
          break;
        case 'LEADER_CHANGED':
          setRoom(prev => ({ ...prev, leader: data.payload }));
          setIsLeader(data.payload.id === user?.id);
          break;
        case 'MEMBER_KICKED':
          if (data.payload.id === user?.id) {
            alert('You have been kicked from the room');
            navigate('/rooms');
          } else {
            setMembers(prev => prev.filter(m => m.id !== data.payload.id));
          }
          break;
        case 'ROOM_CLOSED':
          alert('This room has been closed');
          navigate('/rooms');
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'SEND_MESSAGE',
      payload: {
        content: newMessage.trim()
      }
    }));

    setNewMessage('');
  };

  const handleLeaveRoom = async () => {
    try {
      await api.post(`/rooms/${roomId}/leave`);
      navigate('/rooms');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleKickMember = async (memberId) => {
    if (!isLeader) return;
    
    try {
      await api.post(`/rooms/${roomId}/kick`, { userId: memberId });
    } catch (error) {
      console.error('Failed to kick member:', error);
    }
  };

  const handleTransferLeadership = async (memberId) => {
    if (!isLeader) return;
    
    try {
      await api.post(`/rooms/${roomId}/transfer-leadership`, { userId: memberId });
    } catch (error) {
      console.error('Failed to transfer leadership:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Room Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-gray-600 text-sm">{room.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>{members.length} members</span>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Leave
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg '${
                      message.sender.id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.sender.username}
                      </span>
                      {room.leader?.id === message.sender.id && (
                        <Crown className="h-3 w-3 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-80 bg-white border-l overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Members</h2>
        </div>
        <div className="p-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {member.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{member.username}</span>
                    {room.leader?.id === member.id && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {room.leader?.id !== member.id && (
                    <span className="text-sm text-gray-500">Member</span>
                  )}
                </div>
              </div>
              {isLeader && member.id !== user?.id && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTransferLeadership(member.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => handleKickMember(member.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Kick
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomChatPage;
