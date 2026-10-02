
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Send,
  Users,
  Crown,
  Shield,
  LogOut,
  MoreVertical,
  UserPlus,
  X,
  Play,
  ArrowUpRight
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import webSocketService from '../../services/webSocketService';

const RoomChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [isLeader, setIsLeader] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);

  const [showPeoplePanel, setShowPeoplePanel] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const messagesEndRef = useRef(null);

  /*
   * =========================================================
   * FETCH INITIAL ROOM DETAILS
   * =========================================================
   *
   * REST gives us the initial snapshot of the room.
   *
   * WebSocket is then used for changes that happen after
   * the initial snapshot has been loaded.
   */
  const fetchRoomDetails = async () => {
    try {
      setLoading(true);

      const [roomResponse, membersResponse] =
        await Promise.all([
          api.get(`/rooms/${roomId}`),
          api.get(`/rooms/${roomId}/members`),
        ]);

      const roomData = roomResponse.data;
      const membersData = membersResponse.data;

      setRoom(roomData);

      setMembers(
        membersData.content ?? []
      );

      setIsLeader(
        roomData.currentLeaderId === user?.id
      );

    } catch (error) {

      console.error(
        'Failed to fetch room details:',
        error
      );

      navigate('/rooms');

    } finally {

      setLoading(false);
    }
  };

  /*
   * =========================================================
   * HANDLE INCOMING CHAT MESSAGE
   * =========================================================
   */
  const handleIncomingMessage = (message) => {

    if (!message) {
      return;
    }

    console.log(
      'Room chat message received:',
      message
    );

    setMessages((previousMessages) => [
      ...previousMessages,
      message,
    ]);
  };

  /*
   * =========================================================
   * HANDLE ROOM MEMBER EVENTS
   * =========================================================
   *
   * Backend can send:
   *
   * MEMBER_JOINED
   * MEMBER_LEFT
   * MEMBER_KICKED
   * LEADERSHIP_TRANSFERRED
   *
   * Currently MEMBER_JOINED is implemented here.
   */
  const handleMemberEvent = (event) => {

    if (!event) {
      return;
    }

    console.log(
      'ROOM MEMBER EVENT RECEIVED:',
      event
    );

    switch (event.eventType) {

      case 'MEMBER_JOINED':

        setMembers((previousMembers) => {

          /*
           * Prevent duplicate member entries.
           */
          const alreadyExists =
            previousMembers.some(
              (member) =>
                (member.userId ?? member.id) ===
                event.userId
            );

          if (alreadyExists) {
            return previousMembers;
          }

          return [
            ...previousMembers,
            {
              userId: event.userId,
              username: event.username,
              role: event.role,
              joinedAt: event.joinedAt,
            },
          ];
        });

        /*
         * Update the member count shown in the header.
         *
         * We don't blindly increment here because the event
         * handler may receive a duplicate event.
         */
        setRoom((previousRoom) => {

          if (!previousRoom) {
            return previousRoom;
          }

          return {
            ...previousRoom,
            memberCount:
              previousRoom.memberCount + 1,
          };
        });

        break;

      case 'MEMBER_LEFT':

        setMembers((previousMembers) =>
          previousMembers.filter(
            (member) =>
              (member.userId ?? member.id) !==
              event.userId
          )
        );

        setRoom((previousRoom) => {

          if (!previousRoom) {
            return previousRoom;
          }

          return {
            ...previousRoom,
            memberCount:
              Math.max(
                0,
                previousRoom.memberCount - 1
              ),
          };
        });

        break;

      case 'MEMBER_KICKED':

        setMembers((previousMembers) =>
          previousMembers.filter(
            (member) =>
              (member.userId ?? member.id) !==
              event.userId
          )
        );

        setRoom((previousRoom) => {

          if (!previousRoom) {
            return previousRoom;
          }

          return {
            ...previousRoom,
            memberCount:
              Math.max(
                0,
                previousRoom.memberCount - 1
              ),
          };
        });

        break;

      case 'LEADERSHIP_TRANSFERRED':

        /*
         * We will handle leadership transfer here once the
         * backend starts publishing that event.
         */
        setRoom((previousRoom) => {

          if (!previousRoom) {
            return previousRoom;
          }

          return {
            ...previousRoom,
            currentLeaderId:
              event.userId,
          };
        });

        setMembers((previousMembers) =>
          previousMembers.map((member) => {

            const memberId =
              member.userId ?? member.id;

            if (memberId === event.userId) {

              return {
                ...member,
                role: event.role,
              };
            }

            return member;
          })
        );

        setIsLeader(
          event.userId === user?.id
        );

        break;

      default:

        console.log(
          'Unhandled room member event:',
          event.eventType
        );
    }
  };

  /*
   * =========================================================
   * CONNECT AND SUBSCRIBE TO ROOM WEBSOCKET
   * =========================================================
   */
  const connectToRoomChat = async () => {

    try {

      console.log(
        'RoomChatPage: connecting to WebSocket...'
      );

      /*
       * connect() is safe even if NotificationContext has
       * already established the WebSocket connection.
       */
      await webSocketService.connect();

      console.log(
        'RoomChatPage: WebSocket connected:',
        webSocketService.isConnected()
      );

      /*
       * -----------------------------------------------------
       * CHAT SUBSCRIPTION
       * -----------------------------------------------------
       */
      const messageDestination =
        `/topic/rooms/${roomId}/messages`;

      console.log(
        'RoomChatPage: subscribing to messages:',
        messageDestination
      );

      webSocketService.subscribe(
        messageDestination,
        handleIncomingMessage
      );

      /*
       * -----------------------------------------------------
       * MEMBER SUBSCRIPTION
       * -----------------------------------------------------
       */
      const memberDestination =
        `/topic/rooms/${roomId}/members`;

      console.log(
        'RoomChatPage: subscribing to members:',
        memberDestination
      );

      webSocketService.subscribe(
        memberDestination,
        handleMemberEvent
      );

      console.log(
        'RoomChatPage: room WebSocket subscriptions completed'
      );

    } catch (error) {

      console.error(
        'RoomChatPage: failed to connect/subscribe:',
        error
      );
    }
  };

  /*
   * =========================================================
   * SEND CHAT MESSAGE
   * =========================================================
   */
  const handleSendMessage = (event) => {

    event.preventDefault();

    const content =
      newMessage.trim();

    if (!content || sending) {
      return;
    }

    if (!webSocketService.isConnected()) {

      console.error(
        'Cannot send message: WebSocket is not connected'
      );

      return;
    }

    try {

      setSending(true);

      const destination =
        `/app/rooms/${roomId}/messages`;

      webSocketService.client.publish({
        destination,
        body: JSON.stringify({
          content,
        }),
      });

      setNewMessage('');

    } catch (error) {

      console.error(
        'Failed to send room message:',
        error
      );

    } finally {

      setSending(false);
    }
  };

  /*
   * =========================================================
   * LEAVE ROOM WITH CONFIRMATION
   * =========================================================
   */
  const handleLeaveRoom = async () => {
    try {
      setLeaving(true);

      await api.delete(`/rooms/${roomId}/leave`);

      webSocketService.unsubscribe(`/topic/rooms/${roomId}/messages`);
      webSocketService.unsubscribe(`/topic/rooms/${roomId}/members`);

      setShowLeaveDialog(false);
      navigate('/rooms');

    } catch (error) {
      console.error('Failed to leave room:', error);
      setLeaving(false);
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveDialog(true);
  };

  /*
   * =========================================================
   * KICK MEMBER
   * =========================================================
   */
  const handleKickMember = async (memberId) => {

    if (!isLeader) {
      return;
    }

    try {

      await api.post(
        `/rooms/${roomId}/kick`,
        {
          userId: memberId,
        }
      );

      /*
       * Refresh metadata after the operation.
       *
       * Real-time MEMBER_KICKED handling can later remove
       * this REST refresh.
       */
      await fetchRoomDetails();

      setShowMemberMenu(null);

    } catch (error) {

      console.error(
        'Failed to kick member:',
        error
      );
    }
  };

  /*
   * =========================================================
   * TRANSFER LEADERSHIP
   * =========================================================
   */
  const handleTransferLeadership = async (
    memberId
  ) => {

    if (!isLeader) {
      return;
    }

    try {

      await api.post(
        `/rooms/${roomId}/members/${memberId}/transfer-leadership`
      );

      await fetchRoomDetails();

      setShowMemberMenu(null);

    } catch (error) {

      console.error(
        'Failed to transfer leadership:',
        error
      );
    }
  };

  /*
   * =========================================================
   * INVITE USER
   * =========================================================
   */
  const handleInviteUser = async (e) => {
    e.preventDefault();

    if (!inviteUsername.trim() || inviting) {
      return;
    }

    try {
      setInviting(true);

      // First, search for user by username
      const searchResponse = await api.get(`/users/search?query=${inviteUsername}`);
      const users = searchResponse.data.content || searchResponse.data;

      if (!users || users.length === 0) {
        alert('User not found');
        return;
      }

      const targetUser = users.find(u => u.username === inviteUsername);
      if (!targetUser) {
        alert('User not found');
        return;
      }

      // Invite the user
      await api.post(`/rooms/${roomId}/invitations`, {
        userId: targetUser.id
      });

      alert('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteUsername('');

    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  /*
   * =========================================================
   * FETCH INITIAL DATA
   * =========================================================
   */
  useEffect(() => {

    if (!roomId || !user?.id) {
      return;
    }

    fetchRoomDetails();

  }, [roomId, user?.id]);

  /*
   * =========================================================
   * WEBSOCKET LIFECYCLE
   * =========================================================
   *
   * IMPORTANT:
   *
   * We depend on room?.roomId here.
   *
   * Initially:
   *
   * room = null
   *
   * After REST finishes:
   *
   * room = actual room object
   *
   * This causes this effect to execute after the room has
   * actually been loaded.
   */
  useEffect(() => {

    if (!room?.roomId || !user?.id) {
      return;
    }

    connectToRoomChat();

    return () => {

      console.log(
        'RoomChatPage: cleaning up room subscriptions'
      );

      webSocketService.unsubscribe(
        `/topic/rooms/${roomId}/messages`
      );

      webSocketService.unsubscribe(
        `/topic/rooms/${roomId}/members`
      );
    };

  }, [
    room?.roomId,
    roomId,
    user?.id,
  ]);

  /*
   * =========================================================
   * AUTO-SCROLL CHAT
   * =========================================================
   */
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });

  }, [messages]);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {

    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#121212' }}>
        <p style={{ color: '#A9A198' }}>
          Loading room...
        </p>
      </div>
    );
  }

  /*
   * =========================================================
   * ROOM NOT FOUND
   * =========================================================
   */
  if (!room) {

    return (
      <div className="flex h-full flex-col items-center justify-center" style={{ backgroundColor: '#121212' }}>

        <p className="mb-4" style={{ color: '#A9A198' }}>
          Room not found.
        </p>

        <button
          onClick={() => navigate('/rooms')}
          className="px-4 py-2 rounded-lg font-semibold"
          style={{ backgroundColor: '#C2526A', color: '#121212' }}
        >
          Back to Rooms
        </button>

      </div>
    );
  }

  /*
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <div className="flex h-full min-h-0" style={{ backgroundColor: '#121212' }}>
      {/* Main Room Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Room Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#181614', borderBottom: '1px solid #34302C' }}>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLeaveClick}
              aria-label="Leave room"
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: '#D96565', backgroundColor: '#292521' }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Leave</span>
            </button>

            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#F5F1E8' }}>
                {room.name}
              </h1>
              {room.description && (
                <p className="text-sm" style={{ color: '#A9A198' }}>
                  {room.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPeoplePanel(!showPeoplePanel)}
              aria-label="View room members"
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: '#F5F1E8', backgroundColor: '#292521' }}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{room.memberCount}</span>
            </button>

            {room.type === 'PRIVATE' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ color: '#C2526A', backgroundColor: '#292521' }}
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Invite</span>
              </button>
            )}
          </div>

        </div>

        {/* Room Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#F5F1E8' }}>
              ROOM CONTENT
            </h2>

            {/* Content Player Placeholder */}
            <div
              className="rounded-lg flex items-center justify-center mb-4"
              style={{
                backgroundColor: '#211E1B',
                border: '1px solid #34302C',
                aspectRatio: '16 / 9',
                minHeight: '300px'
              }}
            >
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-2" style={{ color: '#A9A198' }} />
                <p style={{ color: '#A9A198' }}>Nothing is playing</p>
                <p className="text-sm mt-1" style={{ color: '#A9A198' }}>Room content will appear here</p>
              </div>
            </div>

            {/* Now Playing */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2" style={{ color: '#A9A198' }}>
                Now Playing
              </h3>
              <p className="text-lg font-semibold" style={{ color: '#F5F1E8' }}>
                {room.name}
              </p>
            </div>
          </div>

          {/* Chat Section */}
          <div className="border-t" style={{ borderColor: '#34302C' }}>
            <div className="max-w-4xl mx-auto p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#F5F1E8' }}>
                CHAT
              </h2>

              {/* Messages */}
              <div
                className="overflow-y-auto mb-4"
                style={{ maxHeight: '400px', backgroundColor: '#181614', borderRadius: '8px', padding: '16px' }}
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p style={{ color: '#A9A198' }}>
                      No messages yet. Start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const senderId = message.senderId ?? message.userId;
                      const isOwnMessage = senderId === user?.id;
                      const senderName = message.senderUsername ?? message.username ?? (isOwnMessage ? user?.username : 'User');

                      return (
                        <div
                          key={message.messageId ?? message.id ?? index}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-md">
                            {!isOwnMessage && (
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#292521' }}>
                                  <span className="text-xs font-medium" style={{ color: '#C2526A' }}>
                                    {senderName?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium" style={{ color: '#F5F1E8' }}>
                                  {senderName}
                                </span>
                              </div>
                            )}
                            <div
                              className={`px-4 py-3 rounded-lg ${
                                isOwnMessage
                                  ? 'ml-auto'
                                  : ''
                              }`}
                              style={{
                                backgroundColor: isOwnMessage ? '#C2526A' : '#211E1B',
                                color: isOwnMessage ? '#121212' : '#F5F1E8'
                              }}
                            >
                              <p className="break-words">{message.content}</p>
                              {message.createdAt && (
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwnMessage ? 'opacity-70' : ''
                                  }`}
                                  style={{ color: isOwnMessage ? '#121212' : '#A9A198' }}
                                >
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Write something..."
                  className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#211E1B',
                    border: '1px solid #34302C',
                    color: '#F5F1E8'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="flex items-center justify-center w-12 h-12 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#C2526A', color: '#121212' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* People Panel (right side, not overlay) */}
      {showPeoplePanel && (
        <div className="fixed inset-y-0 right-0 w-80 z-40 md:relative md:w-80 md:z-auto flex flex-col" style={{ backgroundColor: '#181614', borderLeft: '1px solid #34302C' }}>
          {/* Mobile overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 -left-full md:hidden"
            onClick={() => setShowPeoplePanel(false)}
          />
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #34302C' }}>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#F5F1E8' }} />
              <h2 className="font-semibold" style={{ color: '#F5F1E8' }}>
                People
              </h2>
              <span className="text-sm" style={{ color: '#A9A198' }}>
                ({members.length})
              </span>
            </div>
            <button
              onClick={() => setShowPeoplePanel(false)}
              aria-label="Close members panel"
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              style={{ color: '#F5F1E8' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {members.length === 0 ? (
              <div className="p-5 text-sm" style={{ color: '#A9A198' }}>
                No members found.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#34302C' }}>
                {members.map((member) => {
                  const memberId = member.userId ?? member.id;
                  const memberUsername = member.username ?? member.user?.username ?? `User ${memberId}`;
                  const memberIsLeader = room.currentLeaderId === memberId;
                  const memberIsCurrentUser = memberId === user?.id;

                  return (
                    <div
                      key={member.roomMemberId ?? member.id ?? member.userId}
                      className="relative flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full" style={{ backgroundColor: '#292521' }}>
                          <span className="text-sm font-semibold" style={{ color: '#C2526A' }}>
                            {memberUsername?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm" style={{ color: '#F5F1E8' }}>
                              {memberUsername}
                            </p>
                            {memberIsCurrentUser && (
                              <span className="text-xs" style={{ color: '#A9A198' }}>
                                You
                              </span>
                            )}
                          </div>
                          {memberIsLeader && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#C2526A' }}>
                              <Crown className="w-3 h-3" />
                              Leader
                            </div>
                          )}
                          {member.role === 'MODERATOR' && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#62C174' }}>
                              <Shield className="w-3 h-3" />
                              Moderator
                            </div>
                          )}
                        </div>
                      </div>

                      {isLeader && !memberIsCurrentUser && (
                        <div className="relative">
                          <button
                            onClick={() => setShowMemberMenu(showMemberMenu === memberId ? null : memberId)}
                            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                            style={{ color: '#F5F1E8' }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {showMemberMenu === memberId && (
                            <div className="absolute right-0 top-10 z-10 w-48 rounded-lg shadow-lg" style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}>
                              <button
                                onClick={() => handleTransferLeadership(memberId)}
                                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#F5F1E8' }}
                              >
                                Transfer leadership
                              </button>
                              <button
                                onClick={() => handleKickMember(memberId)}
                                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
                                style={{ color: '#D96565' }}
                              >
                                Kick member
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Room Confirmation Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#F5F1E8' }}>
              Leave this room?
            </h2>
            <p className="mb-6" style={{ color: '#A9A198' }}>
              You're currently in {room.name}. If you leave, you'll stop being a member of this room.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLeaveDialog(false)}
                disabled={leaving}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ color: '#F5F1E8', backgroundColor: '#292521' }}
              >
                Stay
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#D96565', color: '#F5F1E8' }}
              >
                {leaving ? 'Leaving...' : 'Leave Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#F5F1E8' }}>Invite User to Room</h2>
            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#A9A198' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#292521', border: '1px solid #34302C', color: '#F5F1E8' }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteUsername('');
                  }}
                  disabled={inviting}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ color: '#F5F1E8', backgroundColor: '#292521' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#C2526A', color: '#121212' }}
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomChatPage;