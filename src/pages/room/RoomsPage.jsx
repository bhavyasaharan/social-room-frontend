import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Columns2,
  Columns3,
  Globe,
  List,
  Lock,
  Plus,
  Play,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { ROOM_TYPES } from '../../config/constants';

const ROOM_TYPE_META = {
  [ROOM_TYPES.PUBLIC]: {
    label: 'Public',
    icon: Globe,
    color: '#C2526A',
  },
  [ROOM_TYPES.FRIENDS]: {
    label: 'Friends',
    icon: Users,
    color: '#62C174',
  },
  [ROOM_TYPES.APPROVAL_REQUIRED]: {
    label: 'Approval Required',
    icon: ShieldCheck,
    color: '#A78BFA',
  },
  [ROOM_TYPES.PRIVATE]: {
    label: 'Private',
    icon: Lock,
    color: '#D96565',
  },
};

const RoomsPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [roomLayout, setRoomLayout] = useState(() => {
    const savedLayout = Number(localStorage.getItem('social-room-friends-layout'));
    return [1, 2, 3].includes(savedLayout) ? savedLayout : 2;
  });
  const [expandedRoomId, setExpandedRoomId] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms?page=0&size=20');
      const roomList = response.data?.content || response.data || [];
      setRooms(roomList);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    localStorage.setItem('social-room-friends-layout', String(roomLayout));
  }, [roomLayout]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rooms;

    return rooms.filter((room) => {
      const name = room.name || '';
      const description = room.description || '';
      const type = room.type || '';

      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      );
    });
  }, [rooms, search]);

  const handleJoinRoom = async (room) => {
    const roomId = room.roomId || room.id;
    if (!roomId) return;

    try {
      setJoiningRoomId(roomId);
      const response = await api.post(`/rooms/${roomId}/join`);
      const nextRoomId = response.data?.roomId || roomId;
      navigate(`/rooms/${nextRoomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert(error.response?.data?.message || 'Unable to join this room right now.');
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C2526A]">
              Discover
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#F5F1E8]">Rooms</h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9A198]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rooms"
                className="w-full rounded-xl border border-[#34302C] bg-[#211E1B] py-2.5 pl-10 pr-3 text-sm text-[#F5F1E8] placeholder:text-[#A9A198] focus:border-[#C2526A] focus:outline-none"
              />
            </div>

            <Button
              type="button"
              onClick={() => navigate('/rooms/create')}
              className="inline-flex items-center justify-center gap-2 border border-[#C2526A] bg-[#C2526A] text-[#121212] hover:bg-[#D46B82]"
            >
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>
        </div>

        <div className="mb-4 flex justify-end gap-2" aria-label="Room columns">
          <button
            type="button"
            onClick={() => setRoomLayout(1)}
            aria-label="One column"
            aria-pressed={roomLayout === 1}
            title="One column"
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${roomLayout === 1 ? 'bg-[#C2526A] text-[#121212]' : 'bg-[#211E1B] text-[#A9A198] hover:bg-[#292521]'}`}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setRoomLayout(2)}
            aria-label="Two columns"
            aria-pressed={roomLayout === 2}
            title="Two columns"
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${roomLayout === 2 ? 'bg-[#C2526A] text-[#121212]' : 'bg-[#211E1B] text-[#A9A198] hover:bg-[#292521]'}`}
          >
            <Columns2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setRoomLayout(3)}
            aria-label="Three columns"
            aria-pressed={roomLayout === 3}
            title="Three columns"
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${roomLayout === 3 ? 'bg-[#C2526A] text-[#121212]' : 'bg-[#211E1B] text-[#A9A198] hover:bg-[#292521]'}`}
          >
            <Columns3 className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#34302C] bg-[#211E1B] p-10 text-center text-[#A9A198]">
            Loading rooms...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#34302C] bg-[#211E1B] p-10 text-center">
            <p className="text-lg font-semibold text-[#F5F1E8]">No rooms match your search.</p>
            <p className="mt-2 text-sm text-[#A9A198]">Try another keyword or create a brand new room.</p>
          </div>
        ) : (
          <div className={`grid gap-5 ${roomLayout === 1 ? 'grid-cols-1' : roomLayout === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
            {filteredRooms.map((room) => {
              const roomId = room.roomId || room.id;
              const type = room.type || ROOM_TYPES.PUBLIC;
              const typeMeta = ROOM_TYPE_META[type] || ROOM_TYPE_META[ROOM_TYPES.PUBLIC];
              const TypeIcon = typeMeta.icon;
              const expanded = expandedRoomId === roomId;

              return (
                <div
                  key={roomId}
                  className="overflow-hidden rounded-2xl border border-[#34302C] bg-[#211E1B] shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:-translate-y-1"
                >
                  <div
                    className={`relative bg-cover bg-center ${expanded ? 'h-52' : 'h-40'}`}
                    style={{
                      backgroundImage: `url(${room.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&h=500&fit=crop'})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/20 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[#34302C] bg-[#121212]/70 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] backdrop-blur-sm">
                      <TypeIcon className="h-3.5 w-3.5" style={{ color: typeMeta.color }} />
                      {typeMeta.label}
                    </div>
                    <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-[#34302C] bg-[#121212]/70 px-2.5 py-1.5 text-xs font-medium text-[#F5F1E8] backdrop-blur-sm">
                      <span className="h-2 w-2 rounded-full bg-[#62C174]" />
                      LIVE
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-[#F5F1E8]">{room.name}</h2>
                        <p className="mt-1 text-sm text-[#A9A198]">
                          {room.memberCount ?? room.members?.length ?? 0} members
                        </p>
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-3 min-h-[48px] text-sm text-[#A9A198]">
                      {room.description || 'A lively social room for people to connect, hang out, and chat.'}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleJoinRoom(room)}
                        disabled={joiningRoomId === roomId}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C2526A] px-4 py-2.5 text-sm font-semibold text-[#121212] transition-colors hover:bg-[#D46B82] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {joiningRoomId === roomId ? 'Joining...' : 'Join Room'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedRoomId(expanded ? null : roomId)}
                      aria-expanded={expanded}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#292521] px-4 py-2.5 text-sm font-medium text-[#F5F1E8] transition-colors hover:bg-[#34302C]"
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expanded ? 'Collapse' : 'Expand'}
                    </button>

                    {expanded && (
                      <div className="mt-4 space-y-4 border-t border-[#34302C] pt-4">
                        <div>
                          <h3 className="mb-2 text-sm font-semibold text-[#F5F1E8]">Now playing</h3>
                          <p className="flex items-center gap-2 text-sm text-[#A9A198]">
                            <Play className="h-4 w-4 text-[#C2526A]" />
                            {room.nowPlaying || 'No content playing'}
                          </p>
                        </div>
                        <div>
                          <h3 className="mb-2 text-sm font-semibold text-[#F5F1E8]">Members</h3>
                          {room.members?.length ? (
                            <div className="space-y-2">
                              {room.members.slice(0, 5).map((member, index) => (
                                <div key={member.userId || member.id || index} className="flex items-center gap-2 text-sm text-[#A9A198]">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#34302C] text-xs text-[#F5F1E8]">
                                    {member.username?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                  {member.username || 'Member'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[#A9A198]">Member details are not available.</p>
                          )}
                        </div>
                        <p className="text-xs text-[#A9A198]">Room type: {typeMeta.label}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
