import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Flag, MoreVertical, Send, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'HATE_OR_ABUSE',
  'OTHER',
];

const PrivateChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [chatPartner, setChatPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setConversationMenuOpen(false);
        setMessageMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const conversationsResponse = await api.get('/conversations');
      const conversations = conversationsResponse.data?.content ?? conversationsResponse.data ?? [];
      const currentConversation = conversations.find(
        (conversation) => String(conversation.conversationId) === String(conversationId)
      );

      const partner =
        currentConversation?.participants?.find(
          (participant) => String(participant.userId) !== String(currentUser?.id)
        ) ?? null;

      setChatPartner(partner);

      const messageResponse = await api.get(`/conversations/${conversationId}/messages`, {
        params: { page: 0, size: 50 },
      });

      const items = messageResponse.data?.content ?? messageResponse.data ?? [];
      setMessages(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = useCallback(
    async (event) => {
      event.preventDefault();
      const content = newMessage.trim();
      if (!content || sending || !conversationId) return;

      setSending(true);
      const optimisticMessage = {
        messageId: `optimistic-${Date.now()}`,
        senderId: currentUser?.id,
        senderUsername: currentUser?.username,
        content,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };

      setMessages((previous) => [...previous, optimisticMessage]);
      setNewMessage('');

      try {
        const response = await api.post(`/conversations/${conversationId}/messages`, { content });
        setMessages((previous) =>
          previous.map((message) =>
            message.messageId === optimisticMessage.messageId ? response.data : message
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((previous) => previous.filter((message) => message.messageId !== optimisticMessage.messageId));
        setNewMessage(content);
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUser, newMessage, sending]
  );

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  };

  const handleBlockUser = async () => {
    if (!chatPartner?.userId) return;

    setBlocking(true);
    try {
      await api.post(`/blocks/${chatPartner.userId}`);
      setBlockConfirmOpen(false);
      setConversationMenuOpen(false);
      alert('User blocked successfully.');
    } catch (error) {
      console.error('Failed to block user:', error);
      alert('Unable to block this user right now.');
    } finally {
      setBlocking(false);
    }
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0)),
    [messages]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#121212] text-[#A9A198]">
        Loading conversation...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#34302C] bg-[#211E1B] text-[#F5F1E8]">
      <div className="flex items-center justify-between border-b border-[#34302C] bg-[#181614] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to conversations"
            onClick={() => navigate('/messages')}
            className="rounded-full p-2 text-[#A9A198] transition-colors hover:bg-[#292521] hover:text-[#F5F1E8]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292521] text-sm font-semibold text-[#C2526A]">
            {chatPartner?.username?.charAt(0)?.toUpperCase() ?? '?'}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#F5F1E8]">{chatPartner?.name ?? chatPartner?.username ?? 'Chat'}</h2>
            <p className="text-xs text-[#A9A198]">@{chatPartner?.username ?? 'user'}</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Conversation options"
            onClick={() => setConversationMenuOpen((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#A9A198] transition-colors hover:bg-[#292521] hover:text-[#F5F1E8]"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {conversationMenuOpen && (
            <div className="absolute right-0 top-12 z-10 w-52 overflow-hidden rounded-xl border border-[#34302C] bg-[#181614] shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setConversationMenuOpen(false);
                  if (chatPartner?.userId) navigate(`/profile/${chatPartner.userId}`);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#F5F1E8] transition-colors hover:bg-[#292521]"
              >
                <UserRound className="h-4 w-4 text-[#C2526A]" />
                View profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setConversationMenuOpen(false);
                  setBlockConfirmOpen(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#F5F1E8] transition-colors hover:bg-[#292521]"
              >
                <Ban className="h-4 w-4 text-[#D96565]" />
                Block
              </button>
              <button
                type="button"
                onClick={() => {
                  setConversationMenuOpen(false);
                  setReportTarget({ type: 'USER', id: chatPartner?.userId, title: 'Report user' });
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#F5F1E8] transition-colors hover:bg-[#292521]"
              >
                <Flag className="h-4 w-4 text-[#C2526A]" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sortedMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-[#A9A198]">
            <p className="text-lg text-[#F5F1E8]">No messages yet.</p>
            <p className="mt-2 text-sm">Start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMessages.map((message) => {
              const isOwnMessage = String(message.senderId) === String(currentUser?.id);
              const canReportMessage = !isOwnMessage && message.senderId !== currentUser?.id;

              return (
                <div key={message.messageId ?? `${message.createdAt}-${message.senderId}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <div className="mr-2 mt-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#292521] text-xs font-semibold text-[#C2526A]">
                      {(message.senderUsername ?? chatPartner?.username ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwnMessage && (
                      <span className="mb-1 ml-1 text-[11px] uppercase tracking-[0.12em] text-[#A9A198]">
                        {message.senderUsername ?? chatPartner?.username ?? 'User'}
                      </span>
                    )}

                    <div
                      className={`relative rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        isOwnMessage
                          ? 'bg-[#C2526A] text-[#121212] rounded-br-md'
                          : 'bg-[#121212] text-[#F5F1E8] border border-[#34302C] rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="break-words whitespace-pre-wrap">{message.content}</p>
                        {!isOwnMessage && (
                          <div className="relative ml-2 shrink-0">
                            <button
                              type="button"
                              aria-label="Message options"
                              onClick={() => setMessageMenuId((previous) => (previous === message.messageId ? null : message.messageId))}
                              className="rounded-full p-1 text-[#A9A198] transition-colors hover:bg-[#292521] hover:text-[#F5F1E8]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {messageMenuId === message.messageId && (
                              <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-[#34302C] bg-[#181614] shadow-2xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessageMenuId(null);
                                    setReportTarget({ type: 'MESSAGE', id: message.messageId, title: 'Report message' });
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#F5F1E8] transition-colors hover:bg-[#292521]"
                                >
                                  <Flag className="h-4 w-4 text-[#C2526A]" />
                                  Report message
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="mt-1 text-[10px] text-[#A9A198]">
                      {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      {message.optimistic ? ' · Sending...' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#34302C] bg-[#181614] p-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message..."
            aria-label="Write a message"
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl border border-[#34302C] bg-[#121212] px-4 py-3 text-sm text-[#F5F1E8] placeholder:text-[#A9A198] focus:border-[#C2526A] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!newMessage.trim() || sending}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C2526A] text-[#121212] transition-colors hover:bg-[#D46B82] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {blockConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#34302C] bg-[#211E1B] p-6">
            <h3 className="mb-3 text-xl font-semibold text-[#F5F1E8]">Block {chatPartner?.name ?? chatPartner?.username ?? 'user'}?</h3>
            <p className="mb-6 text-sm text-[#A9A198]">You will no longer be able to message each other.</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockConfirmOpen(false)}
                className="rounded-xl border border-[#34302C] bg-[#292521] px-4 py-2 text-sm font-medium text-[#F5F1E8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlockUser}
                disabled={blocking}
                className="rounded-xl bg-[#D96565] px-4 py-2 text-sm font-semibold text-[#F5F1E8] disabled:opacity-60"
              >
                {blocking ? 'Blocking...' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportTarget && (
        <ReportDialog
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          title={reportTarget.title}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};

const ReportDialog = ({ targetType, targetId, title, onClose }) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!targetId) return;

    setSubmitting(true);
    try {
      await api.post('/reports', {
        targetType,
        targetId,
        reason,
        description,
      });
      onClose();
      alert('Report submitted successfully.');
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Unable to submit the report right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#34302C] bg-[#211E1B] p-6 shadow-2xl">
        <h3 className="mb-4 text-2xl font-semibold text-[#F5F1E8]">{title}</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="report-reason" className="mb-2 block text-sm font-medium text-[#A9A198]">
            Reason
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mb-4 w-full rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2.5 text-[#F5F1E8] focus:border-[#C2526A] focus:outline-none"
          >
            {REPORT_REASONS.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <label htmlFor="report-description" className="mb-2 block text-sm font-medium text-[#A9A198]">
            Details
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Tell us more about what happened..."
            className="w-full rounded-xl border border-[#34302C] bg-[#121212] px-3 py-2.5 text-[#F5F1E8] placeholder:text-[#A9A198] focus:border-[#C2526A] focus:outline-none"
          />

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#34302C] bg-[#292521] px-4 py-2 text-sm font-medium text-[#F5F1E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#C2526A] px-4 py-2 text-sm font-semibold text-[#121212] disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrivateChatPage;
