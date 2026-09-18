import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPPage from './pages/auth/OTPPage';
import RoomDiscoveryPage from './pages/room/RoomDiscoveryPage';
import CreateRoomPage from './pages/room/CreateRoomPage';
import RoomChatPage from './pages/room/RoomChatPage';
import ProfilePage from './pages/profile/ProfilePage';
import FriendsPage from './pages/friends/FriendsPage';
import MessagesListPage from './pages/chat/MessagesListPage';
import PrivateChatPage from './pages/chat/PrivateChatPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/otp" element={<OTPPage />} />

          {/* Protected Routes */}
          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoomDiscoveryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateRoomPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/:roomId"
            element={
              <ProtectedRoute>
                <RoomChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username?"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Layout>
                  <FriendsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessagesListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <PrivateChatPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
