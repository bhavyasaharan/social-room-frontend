import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const PrivateChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [chatPartner, setChatPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null);
  const hasFetched = useRef(false);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      // 1. Load conversation metadata (participants list)
      const convRes = await api.get('/conversations');
      const convList = convRes.data?.content ?? convRes.data ?? [];
      const conv = convList.find(
        (c) => String(c.conversationId) === String(conversationId)
      );

      // Derive chat partner from participants
      if (conv?.participants) {
        const partner = conv.participants.find(
          (p) => String(p.userId) !== String(currentUser?.id)
        );
        setChatPartner(partner ?? null);
      }

      // 2. Load first page of messages
      await loadMessages(0, true);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (pageNum = 0, replace = false) => {
    try {
      const res = await api.get(
        `/conversations/${conversationId}/messages`,
        { params: { page: pageNum, size: 30, sort: 'createdAt,asc' } }
      );

      const data = res.data;
      const fetched = data?.content ?? data ?? [];
      const totalPages = data?.totalPages ?? 1;

      setMessages((prev) => (replace ? fetched : [...fetched, ...prev]));
      setHasMore(pageNum < totalPages - 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // ── Load older messages ────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadMessages(page + 1, false);
    setLoadingMore(false);
  };

  // ── Send message via REST ──────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const content = newMessage.trim();
      if (!content || sending) return;

      setSending(true);
      setNewMessage('');

      // Optimistic update
      const optimistic = {
        messageId: `optimistic-${Date.now()}`,
        conversationId,
        senderId: currentUser?.id,
        senderUsername: currentUser?.username,
        content,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await api.post(`/conversations/${conversationId}/messages`, {
          content,
        });
        // Replace optimistic message with real one from server
        setMessages((prev) =>
          prev.map((m) => (m.messageId === optimistic.messageId ? res.data : m))
        );
      } catch (err) {
        console.error('Failed to send message:', err);
        // Remove failed optimistic message
        setMessages((prev) =>
          prev.filter((m) => m.messageId !== optimistic.messageId)
        );
        setNewMessage(content); // Restore input so user can retry
      } finally {
        setSending(false);
      }
    },
    [newMessage, conversationId, currentUser, sending]
  );

  // ── Handle Enter key ───────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading chat…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm px-4 py-3 flex items-center space-x-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/friends')}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white font-semibold text-sm">
            {chatPartner?.username?.charAt(0).toUpperCase() ?? '?'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">
            {chatPartner ? `@${chatPartner.username}` : 'Chat'}
          </h2>
          {chatPartner?.name && (
            <p className="text-xs text-gray-500 truncate">{chatPartner.name}</p>
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Load more */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full py-20 space-y-2">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Send className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">
              No messages yet. Say hi! 👋
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn =
            String(msg.senderId) === String(currentUser?.id);

          return (
            <div
              key={msg.messageId}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for other user */}
              {!isOwn && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end">
                  <span className="text-white text-xs font-semibold">
                    {(msg.senderUsername ?? chatPartner?.username ?? '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}

              <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Sender name for other user */}
                {!isOwn && (
                  <span className="text-xs text-gray-400 mb-1 ml-1">
                    @{msg.senderUsername ?? chatPartner?.username}
                  </span>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isOwn
                      ? `bg-blue-600 text-white rounded-br-sm ${msg.optimistic ? 'opacity-70' : ''}`
                      : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>

                <span className="text-xs text-gray-400 mt-1 px-1">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                  {msg.optimistic && ' · Sending…'}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-t px-4 py-3 shadow-md">
        <form
          onSubmit={handleSendMessage}
          className="flex items-end space-x-3"
        >
          <textarea
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 resize-none px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm max-h-32 overflow-y-auto bg-gray-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1 ml-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default PrivateChatPage;
