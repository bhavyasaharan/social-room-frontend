import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Users, Lock, Shield } from 'lucide-react';
import { ROOM_TYPES } from '../../config/constants';
import api from '../../services/api';

const RoomDiscoveryPage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PUBLIC, APPROVAL_REQUIRED

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rooms', { params: { type: filter === 'ALL' ? undefined : filter } });
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await api.post(`/rooms/${roomId}/join`);
      navigate(`/rooms/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const getRoomTypeIcon = (type) => {
    switch (type) {
      case ROOM_TYPES.PUBLIC:
        return <Users className="h-4 w-4" />;
      case ROOM_TYPES.APPROVAL_REQUIRED:
        return <Shield className="h-4 w-4" />;
      case ROOM_TYPES.PRIVATE:
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoomTypeLabel = (type) => {
    switch (type) {
      case ROOM_TYPES.PUBLIC:
        return 'Public';
      case ROOM_TYPES.APPROVAL_REQUIRED:
        return 'Approval Required';
      case ROOM_TYPES.PRIVATE:
        return 'Private';
      default:
        return type;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discover Rooms</h1>
        <Button onClick={() => navigate('/rooms/create')}>
          <Plus className="h-5 w-5 mr-2" />
          Create Room
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2">
          {['ALL', 'PUBLIC', 'APPROVAL_REQUIRED'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilter(type)}
            >
              {type === 'ALL' ? 'All Rooms' : getRoomTypeLabel(type)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No rooms found. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} onClick={() => handleJoinRoom(room.id)}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{room.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  {getRoomTypeIcon(room.type)}
                  <span className="ml-1">{getRoomTypeLabel(room.type)}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{room.memberCount} members</span>
                </div>
                <div>
                  <span className="font-medium">Leader: {room.leader?.username}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomDiscoveryPage;
