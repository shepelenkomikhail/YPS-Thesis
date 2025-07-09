# Your Personal Space (YPS)

A modern, full-stack productivity dashboard that consolidates essential tools into one customizable workspace. Built to minimize distractions and maximize focus for knowledge workers.

## 🚀 Features

### 📱 **Responsive Dashboard**
- Drag-and-drop widget system with customizable layouts
- Dark/Light theme support with system preference detection
- Mobile-optimized interface with adaptive layouts
- Custom background image support

### 🔐 **Authentication & User Management**
- Email/password registration with verification
- OAuth integration (Google & GitHub)
- Secure JWT-based session management
- Password reset functionality
- Profile customization with avatar upload

### 📝 **Productivity Widgets**
- **Notes**: Create, edit, and organize notes in multiple formats (text, checklist, ordered list)
- **Calendar**: Day/week/month views with event management
- **Weather**: Real-time weather data with location detection and 5-hour forecasts
- **News**: Location-based news headlines with auto-refresh every 5 minutes
- **Chat**: Real-time messaging with file sharing, friend management, and presence indicators

### 🌐 **Real-time Features**
- WebSocket-powered live chat with typing indicators
- Friend requests and status updates
- File sharing with media preview (up to 60MB total, 15MB per file)
- Online/offline presence tracking

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** + **Material-UI** for styling
- **Framer Motion** for animations
- **React Grid Layout** for draggable widgets
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** with **Express.js** and TypeScript
- **MongoDB** with **Mongoose** ODM
- **Socket.IO** for WebSocket connections
- **JWT** authentication with **Passport.js**
- **Multer** for file uploads
- **Nodemailer** for email services

### External APIs
- **Visual Crossing Weather API** - Weather data
- **NewsData.io API** - News headlines
- **OpenCage Geocoding API** - Location services

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- API keys for external services (see Environment Variables section)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shepelenkomikhail/YPS-GitHub.git
cd YPS-GitHub
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file with required environment variables
cp .env.example .env
# Edit .env with your configuration
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Start the Application**

Backend (Terminal 1):
```bash
cd backend
npm start
```

Frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## ⚙️ Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=8000
SECRET_KEY=your_jwt_secret_key

# Database
MONGO_URI=your_mongodb_connection_string

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# External APIs
NEWSDATA_API_KEY=your_newsdata_api_key
WEATHER_API_KEY=your_visual_crossing_api_key
OPENCAGE_API_KEY=your_opencage_api_key

# Email Service
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```
