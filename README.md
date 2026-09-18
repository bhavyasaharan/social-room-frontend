# Social Room Frontend

Frontend application for the Social Room Platform - a social hangout platform where users can discover temporary public rooms, join them, meet and chat with other people, and participate in shared activities.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (Button, Input, Modal, Card, ProtectedRoute)
│   ├── layout/          # Layout components (Header, Layout)
│   ├── auth/            # Authentication-specific components
│   ├── room/            # Room-specific components
│   └── profile/         # Profile-specific components
├── pages/
│   ├── auth/            # Authentication pages (Login, Register, OTP)
│   ├── room/            # Room pages (Discovery, Create, Chat)
│   ├── profile/         # Profile page
│   ├── friends/         # Friends management page
│   ├── chat/            # Private messaging pages
│   └── LandingPage.jsx  # Landing page
├── context/
│   └── AuthContext.jsx  # Authentication context
├── hooks/               # Custom React hooks
├── services/
│   └── api.js           # Axios instance with interceptors
├── utils/
│   └── validators.js    # Form validation utilities
├── config/
│   └── constants.js     # Application constants
└── App.jsx              # Main app with routing
```

## Features Implemented

### Authentication
- Email/Password login
- Email/Password registration
- Phone/OTP authentication
- 18+ age confirmation
- JWT token handling

### Rooms
- Room discovery with filtering (Public, Approval Required)
- Create rooms (Public, Approval Required, Private)
- Real-time chat with WebSocket
- Member list with leader identification
- Leadership transfer
- Kick members
- Leave room

### Profile
- View own and other profiles
- Edit profile (name, bio, social links)
- Profile picture upload
- Public/Private profile settings

### Friends
- Send friend requests
- Accept/reject requests
- View friends list
- Remove friends
- Block users

### Private Messaging
- View conversations list
- Real-time private chat with friends
- WebSocket-based messaging

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Configuration

The frontend is configured to proxy API requests to the Spring Boot backend:

- **API Base URL**: `/api` (proxied to `http://localhost:8080`)
- **WebSocket URL**: `ws://localhost:8080/ws`

Configuration is in `vite.config.js` and `src/config/constants.js`

## Environment Variables

Currently using hardcoded configuration. For production, consider adding:

```env
VITE_API_BASE_URL=https://api.socialroom.com
VITE_WS_BASE_URL=wss://api.socialroom.com/ws
```

## Authentication Flow

1. User logs in via email/password, phone/OTP, or Google
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. Axios interceptor adds token to all requests
5. Protected routes check for authentication
6. 401 responses redirect to login

## WebSocket Integration

WebSocket connections are established for:
- Room chat (`/rooms/:roomId`)
- Private messaging (`/messages/:userId`)

Messages are sent/received in JSON format with type/payload structure.

## Future Enhancements

- Voice chat
- Shared media (YouTube, music)
- Games
- Advanced discovery (tags, search, trending)
- Push notifications
- Admin dashboard

## Notes

- Backend API endpoints are placeholders and need to be implemented in Spring Boot
- WebSocket endpoints need to be implemented in Spring Boot
- File upload endpoints need to be implemented in Spring Boot
- Google OAuth integration needs to be configured
