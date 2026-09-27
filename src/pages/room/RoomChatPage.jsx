
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Send,
  Users,
  Crown,
  Shield,
  LogOut,
  MoreVertical,
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
   * LEAVE ROOM
   * =========================================================
   */
  const handleLeaveRoom = async () => {

    try {

      await api.delete(
        `/rooms/${roomId}/leave`
      );

      /*
       * Remove room-specific subscriptions.
       *
       * We DO NOT call webSocketService.disconnect()
       * because NotificationContext may still be using
       * the same WebSocket connection.
       */
      webSocketService.unsubscribe(
        `/topic/rooms/${roomId}/messages`
      );

      webSocketService.unsubscribe(
        `/topic/rooms/${roomId}/members`
      );

      navigate('/rooms');

    } catch (error) {

      console.error(
        'Failed to leave room:',
        error
      );
    }
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">
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
      <div className="flex flex-col items-center justify-center min-h-screen">

        <p className="text-gray-500 mb-4">
          Room not found.
        </p>

        <button
          onClick={() => navigate('/rooms')}
          className="px-4 py-2 rounded bg-blue-600 text-white"
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
    <div className="flex h-screen bg-gray-100">

      {/* =====================================================
          LEFT SIDE - CHAT
          ===================================================== */}

      <div className="flex flex-col flex-1">

        {/* Room header */}

        <div className="flex items-center justify-between px-6 py-4 bg-white border-b">

          <div>

            <h1 className="text-xl font-semibold">
              {room.name}
            </h1>

            {room.description && (
              <p className="text-sm text-gray-500">
                {room.description}
              </p>
            )}

          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center text-sm text-gray-500">

              <Users className="w-4 h-4 mr-1" />

              {room.memberCount} members

            </div>

            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>

          </div>

        </div>

        {/* Messages */}

        <div className="flex-1 overflow-y-auto p-6">

          {messages.length === 0 ? (

            <div className="flex items-center justify-center h-full">

              <p className="text-gray-400">
                No messages yet. Start the conversation.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {messages.map((message, index) => {

                const senderId =
                  message.senderId ??
                  message.userId;

                const isOwnMessage =
                  senderId === user?.id;

                const senderName =
                  message.senderUsername ??
                  message.username ??
                  (
                    isOwnMessage
                      ? user?.username
                      : 'User'
                  );

                return (
                  <div
                    key={
                      message.messageId ??
                      message.id ??
                      index
                    }
                    className={`flex ${
                      isOwnMessage
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >

                    <div
                      className={`max-w-md px-4 py-3 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >

                      {!isOwnMessage && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {senderName}
                        </p>
                      )}

                      <p className="break-words">
                        {message.content}
                      </p>

                      {message.createdAt && (
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage
                              ? 'text-blue-100'
                              : 'text-gray-400'
                          }`}
                        >
                          {new Date(
                            message.createdAt
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}

                    </div>

                  </div>
                );
              })}

              <div ref={messagesEndRef} />

            </div>
          )}

        </div>

        {/* Message input */}

        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 p-4 bg-white border-t"
        >

          <input
            type="text"
            value={newMessage}
            onChange={(event) =>
              setNewMessage(event.target.value)
            }
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={
              !newMessage.trim() ||
              sending
            }
            className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>

        </form>

      </div>

      {/* =====================================================
          RIGHT SIDE - MEMBERS
          ===================================================== */}

      <div className="w-80 bg-white border-l flex flex-col">

        {/* Members header */}

        <div className="px-5 py-4 border-b">

          <div className="flex items-center gap-2">

            <Users className="w-5 h-5" />

            <h2 className="font-semibold">
              Members
            </h2>

            <span className="text-sm text-gray-500">
              ({members.length})
            </span>

          </div>

        </div>

        {/* Member list */}

        <div className="flex-1 overflow-y-auto">

          {members.length === 0 ? (

            <div className="p-5 text-sm text-gray-500">
              No members found.
            </div>

          ) : (

            <div className="divide-y">

              {members.map((member) => {

                const memberId =
                  member.userId ??
                  member.id;

                const memberUsername =
                  member.username ??
                  member.user?.username ??
                  `User ${memberId}`;

                const memberIsLeader =
                  room.currentLeaderId === memberId;

                const memberIsCurrentUser =
                  memberId === user?.id;

                return (
                  <div
                    key={
                      member.roomMemberId ??
                      member.id ??
                      member.userId
                    }
                    className="relative flex items-center justify-between px-5 py-4"
                  >

                    <div className="flex items-center gap-3">

                      {/* Avatar */}

                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200">

                        <span className="text-sm font-semibold">
                          {memberUsername
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </span>

                      </div>

                      {/* User information */}

                      <div>

                        <div className="flex items-center gap-2">

                          <p className="font-medium text-sm">
                            {memberUsername}
                          </p>

                          {memberIsCurrentUser && (
                            <span className="text-xs text-gray-400">
                              You
                            </span>
                          )}

                        </div>

                        {/* Leader */}

                        {memberIsLeader && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">

                            <Crown className="w-3 h-3" />

                            Leader

                          </div>
                        )}

                        {/* Moderator */}

                        {member.role === 'MODERATOR' && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">

                            <Shield className="w-3 h-3" />

                            Moderator

                          </div>
                        )}

                      </div>

                    </div>

                    {/* Leader actions */}

                    {isLeader &&
                      !memberIsCurrentUser && (

                      <div className="relative">

                        <button
                          onClick={() =>
                            setShowMemberMenu(
                              showMemberMenu === memberId
                                ? null
                                : memberId
                            )
                          }
                          className="p-2 rounded hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMemberMenu === memberId && (

                          <div className="absolute right-0 top-10 z-10 w-48 bg-white border rounded-lg shadow-lg">

                            <button
                              onClick={() =>
                                handleTransferLeadership(
                                  memberId
                                )
                              }
                              className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                            >
                              Transfer leadership
                            </button>

                            <button
                              onClick={() =>
                                handleKickMember(
                                  memberId
                                )
                              }
                              className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
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

    </div>
  );
};

export default RoomChatPage;