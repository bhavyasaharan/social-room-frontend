import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Plus, Search, MoreVertical, UserRound, Ban, Flag, Send, ArrowLeft, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import PrivateChatPage from './PrivateChatPage';

const MessagesListPage = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user: currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessageUsername, setNewMessageUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const hasFetched = useRef(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/conversations');
      setConversations(response.data?.content ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchConversations();
  }, []);

  const getOtherParticipant = (participants = []) => {
    if (!participants.length) return null;
    return participants.find((participant) => String(participant.userId) !== String(currentUser?.id)) ?? participants[0];
  };

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const other = getOtherParticipant(conversation.participants ?? []);
      if (!other) return false;

      if (!query) return true;

      return (
        other.username?.toLowerCase().includes(query) ||
        other.name?.toLowerCase().includes(query)
      );
    });
  }, [conversations, currentUser?.id, searchQuery]);

  const formatTime = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateConversation = async (event) => {
    event.preventDefault();
    const trimmed = newMessageUsername.trim();

    if (!trimmed) return;

    setCreating(true);
    try {
      const response = await api.post('/conversations', {
        participantUsername: trimmed,
      });

      setShowNewMessageModal(false);
      setNewMessageUsername('');
      navigate(`/messages/${response.data?.conversationId ?? response.data?.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please check the username and try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[600px] overflow-hidden rounded-2xl border border-[#34302C] bg-[#181614] text-[#F5F1E8]">
      <aside className={`flex w-full flex-col border-r border-[#34302C] bg-[#181614] ${conversationId ? 'hidden md:flex md:w-[360px]' : 'w-full md:w-[360px]'}`}>
        <div className="border-b border-[#34302C] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-wide text-[#F5F1E8]">Messages</h1>
            <button
              type="button"
              aria-label="New message"
              onClick={() => setShowNewMessageModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#C2526A]/40 bg-[#292521] text-[#C2526A] transition-colors hover:bg-[#34302C]"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9A198]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages..."
              aria-label="Search conversations"
              className="w-full rounded-xl border border-[#34302C] bg-[#211E1B] py-2.5 pl-10 pr-3 text-sm text-[#F5F1E8] placeholder:text-[#A9A198] focus:border-[#C2526A] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center px-4 text-sm text-[#A9A198]">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[#A9A198]">
              <MessageSquare className="mb-4 h-12 w-12 text-[#A9A198]" />
              <p className="mb-2 text-base text-[#F5F1E8]">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && <p className="text-sm">Start a chat with a friend.</p>}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation.participants ?? []);
              if (!otherParticipant) return null;

              const isSelected = String(conversation.conversationId) === String(conversationId);
              const lastMessage = conversation.lastMessage ?? conversation.messages?.[0] ?? null;

              return (
                <button
                  key={conversation.conversationId}
                  type="button"
                  onClick={() => navigate(`/messages/${conversation.conversationId}`)}
                  className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-[#C2526A] bg-[#292521]'
                      : 'border-transparent bg-transparent hover:bg-[#292521]'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#211E1B] text-base font-semibold text-[#C2526A]">
                    {otherParticipant.username?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-[#F5F1E8]">
                        {otherParticipant.name ?? otherParticipant.username ?? 'User'}
                      </span>
                      {lastMessage?.createdAt && (
                        <span className="shrink-0 text-[10px] text-[#A9A198]">
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-[#A9A198]">
                        {lastMessage?.content ?? 'No messages yet'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C2526A] px-1.5 text-[10px] font-semibold text-[#121212]">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {showNewMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#34302C] bg-[#211E1B] p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-semibold text-[#F5F1E8]">New Message</h2>
            <form onSubmit={handleCreateConversation}>
              <label htmlFor="participant-username" className="mb-2 block text-sm font-medium text-[#A9A198]">
                Username
              </label>
              <input
                id="participant-username"
                type="text"
                value={newMessageUsername}
                onChange={(event) => setNewMessageUsername(event.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2.5 text-[#F5F1E8] placeholder:text-[#A9A198] focus:border-[#C2526A] focus:outline-none"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMessageModal(false);
                    setNewMessageUsername('');
                  }}
                  className="rounded-xl border border-[#34302C] bg-[#292521] px-4 py-2 text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-[#34302C]"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#C2526A] px-4 py-2 text-sm font-semibold text-[#121212] transition-colors hover:bg-[#D46B82] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'Creating...' : 'Start Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesListPage;
