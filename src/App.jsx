import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPPage from './pages/auth/OTPPage';
import HomePage from './pages/home/HomePage';
import RoomsPage from './pages/room/RoomsPage';
import CreateRoomPage from './pages/room/CreateRoomPage';
import RoomChatPage from './pages/room/RoomChatPage';
import ProfilePage from './pages/profile/ProfilePage';
import FriendsPage from './pages/friends/FriendsPage';
import MessagesListPage from './pages/chat/MessagesListPage';
import PrivateChatPage from './pages/chat/PrivateChatPage';
import PostsPage from './pages/posts/PostsPage';
import AdminPage from './pages/admin/AdminPage';
import SettingsPage from './pages/settings/SettingsPage';
import AccountSettingsPage from './pages/settings/AccountSettingsPage';
import ConnectedAccountsPage from './pages/settings/ConnectedAccountsPage';
import PasswordSettingsPage from './pages/settings/PasswordSettingsPage';
import PrivacySettingsPage from './pages/settings/PrivacySettingsPage';
import { NotificationProvider } from './context/NotificationContext';

function App() { return ( <AuthProvider> <NotificationProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/otp" element={<OTPPage />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/account"
            element={
              <ProtectedRoute>
                <Layout>
                  <AccountSettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
                    <Route
            path="/settings/account/connected-accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConnectedAccountsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
  path="/settings/account/password"
  element={
    <ProtectedRoute>
      <Layout>
        <PasswordSettingsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/settings/privacy"
  element={
    <ProtectedRoute>
      <Layout>
        <PrivacySettingsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoomsPage />
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
                <Layout fullScreen>
                  <RoomChatPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId?"
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
                <Layout fullScreen>
                  <MessagesListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <ProtectedRoute>
                <Layout fullScreen>
                  <MessagesListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts"
            element={
              <ProtectedRoute>
                <Layout>
                  <PostsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
</NotificationProvider> </AuthProvider> ); }

export default App;
