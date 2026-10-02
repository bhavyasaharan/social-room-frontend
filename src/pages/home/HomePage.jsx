import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DoorOpen,
  MessageSquare,
  Music,
  Gamepad2,
  Coffee,
  Clock,
  UserPlus
} from 'lucide-react';
import api from '../../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  // Mock data for Happening Now rooms
  const activeRooms = [
    {
      id: '1',
      name: 'Late Night Music',
      memberCount: 12,
      type: 'PUBLIC',
      icon: Music,
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=200&fit=crop'
    },
    {
      id: '2',
      name: 'Weekend Gaming',
      memberCount: 8,
      type: 'PUBLIC',
      icon: Gamepad2,
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop'
    },
    {
      id: '3',
      name: 'Coffee Chat',
      memberCount: 5,
      type: 'FRIENDS',
      icon: Coffee,
      thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop'
    }
  ];

  // Mock data for Recent Activity
  const recentActivities = [
    {
      id: '1',
      type: 'room',
      title: 'Late Night Music',
      timestamp: '2h ago',
      icon: DoorOpen
    },
    {
      id: '2',
      type: 'message',
      title: 'Alex',
      timestamp: 'Yesterday',
      icon: MessageSquare
    },
    {
      id: '3',
      type: 'room',
      title: 'Weekend Gaming',
      timestamp: 'Yesterday',
      icon: DoorOpen
    }
  ];

  // Mock data for People You May Know
  const suggestedUsers = [
    {
      id: '1',
      username: 'Alex',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    {
      id: '2',
      username: 'Sarah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      id: '3',
      username: 'Rahul',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#121212' }}>
      <main className="p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <WelcomeSection
            greeting={getGreeting()}
            username={user?.username || 'User'}
          />

          <HappeningNowSection rooms={activeRooms} navigate={navigate} />

          <RecentActivitySection activities={recentActivities} />

          <PeopleYouMayKnowSection users={suggestedUsers} />
        </div>
      </main>
    </div>
  );
};

const WelcomeSection = ({ greeting, username }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#F5F1E8' }}>
        {greeting}, {username}
      </h1>
      <p className="text-lg" style={{ color: '#A9A198' }}>
        Welcome back to Social Room.
      </p>
    </div>
  );
};

const HappeningNowSection = ({ rooms, navigate }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D96565' }}></div>
        <h2 className="text-xl font-semibold" style={{ color: '#F5F1E8' }}>
          HAPPENING NOW
        </h2>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => (
          <ActiveRoomCard key={room.id} room={room} navigate={navigate} />
        ))}
      </div>

      <button
        onClick={() => navigate('/friends')}
        className="mt-4 w-full py-3 rounded-lg font-semibold transition-colors border-2"
        style={{
          color: '#C2526A',
          borderColor: '#C2526A',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#C2526A';
          e.target.style.color = '#121212';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#C2526A';
        }}
      >
        View All Rooms
      </button>
    </div>
  );
};

const ActiveRoomCard = ({ room, navigate }) => {
  const Icon = room.icon;
  const [joining, setJoining] = React.useState(false);

  const handleJoinClick = async () => {
    try {
      setJoining(true);
      const response = await api.post(`/rooms/${room.id}/join`);
      if (response.data.joined) {
        navigate(`/rooms/${response.data.roomId}`);
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden transition-all hover:scale-[1.02]"
      style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}
    >
      {/* Thumbnail */}
      <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${room.thumbnail})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C2526A' }}>
            <Icon className="h-5 w-5" style={{ color: '#121212' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: '#F5F1E8' }}>
            {room.type}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#62C174' }}></div>
          <span className="text-sm" style={{ color: '#F5F1E8' }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#F5F1E8' }}>
          {room.name}
        </h3>
        <p className="text-sm mb-4" style={{ color: '#A9A198' }}>
          {room.memberCount} people are hanging out
        </p>
        <button
          onClick={handleJoinClick}
          className="w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          style={{
            backgroundColor: '#C2526A',
            color: '#121212'
          }}
          onMouseEnter={(e) => {
            if (!joining) e.target.style.backgroundColor = '#D46B82';
          }}
          onMouseLeave={(e) => {
            if (!joining) e.target.style.backgroundColor = '#C2526A';
          }}
          disabled={joining}
        >
          {joining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </div>
  );
};

const RecentActivitySection = ({ activities }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#F5F1E8' }}>
        YOUR RECENT ACTIVITY
      </h2>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}>
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const Icon = activity.icon;
  return (
    <div
      className="flex items-center justify-between p-4 transition-colors hover:bg-gray-700"
      style={{ borderBottom: '1px solid #34302C' }}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5" style={{ color: '#C2526A' }} />
        <span style={{ color: '#F5F1E8' }}>{activity.title}</span>
      </div>
      <div className="flex items-center space-x-2" style={{ color: '#A9A198' }}>
        <Clock className="h-4 w-4" />
        <span className="text-sm">{activity.timestamp}</span>
      </div>
    </div>
  );
};

const PeopleYouMayKnowSection = ({ users }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#F5F1E8' }}>
        PEOPLE YOU MAY KNOW
      </h2>

      <div className="flex space-x-4 overflow-x-auto pb-2">
        {users.map((user) => (
          <SuggestedUserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};

const SuggestedUserCard = ({ user }) => {
  return (
    <div
      className="flex-shrink-0 w-32 rounded-lg p-4 text-center transition-colors hover:bg-gray-700"
      style={{ backgroundColor: '#211E1B', border: '1px solid #34302C' }}
    >
      <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
        <img
          src={user.avatar}
          alt={user.username}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-medium mb-2" style={{ color: '#F5F1E8' }}>
        {user.username}
      </p>
      <button className="w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1" style={{ backgroundColor: '#C2526A', color: '#121212' }}>
        <UserPlus className="h-4 w-4" />
        <span>Add</span>
      </button>
    </div>
  );
};

export default HomePage;
