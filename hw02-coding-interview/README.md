# CodeSyncPad

A real-time collaborative code editor with instant execution capabilities, built for modern web development and coding interviews.



## 🚀 Live Demo

Visit the live application: [CodeSyncPad on Render](https://codesyncpad.onrender.com)

## 🌟 Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously with instant synchronization
- **Code Execution**: Run JavaScript and Python code directly in the browser using WebAssembly
- **Typing Indicators**: See who's typing with color-coded user indicators
- **Syntax Highlighting**: Beautiful code highlighting powered by CodeMirror
- **Session Management**: Create and share coding sessions with unique URLs
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable coding
- **WebSocket Support**: Real-time communication with automatic reconnection



## 🛠️ Tech Stack

### Frontend

- **React 18.2.0** - Modern UI library
- **Vite 5.0.8** - Fast build tool and development server
- **CodeMirror 4.21.21** - Code editor with syntax highlighting
- **Socket.io Client 4.7.2** - Real-time WebSocket communication
- **Pyodide 0.24.1** - Python runtime in WebAssembly

### Backend

- **Node.js 20** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **Socket.io 4.7.2** - Real-time bidirectional event-based communication
- **PostgreSQL** - Robust database for session persistence
- **node-postgres (pg)** - PostgreSQL client for Node.js

### DevOps & Deployment

- **Docker** - Containerization with multi-stage builds
- **Nginx** - Reverse proxy and static file serving
- **Render** - Cloud platform for deployment
- **GitHub Actions** - CI/CD pipeline ready

## 📁 Project Structure

```
hw02-coding-interview/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Main application pages
│   │   ├── utils/             # Utility functions
│   │   └── api/               # API communication layer
│   ├── public/                # Static assets
│   └── package.json
├── server/                     # Express.js backend
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── db/                # Database layer
│   │   ├── socket/            # WebSocket handlers
│   │   └── config/            # Application configuration
│   └── package.json
├── deploy/                     # Deployment configurations
├── docker-compose.yml          # Local development setup
└── render.yaml                # Render deployment blueprint
```

## 🏃‍♂️ Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **Docker** and **Docker Compose** (for local development)
- **PostgreSQL** (or use Docker setup)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/sdhlyhb/ai-dev-tools-zoomcamp-2025.git
   cd ai-dev-tools-zoomcamp-2025/hw02-coding-interview
   ```

2. **Start with Docker (Recommended)**

   ```bash
   # Start all services (database, backend, frontend)
   docker compose up -d

   # View logs
   docker compose logs -f
   ```

   The application will be available at http://localhost

3. **Manual Setup (Alternative)**

   **Backend:**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```

   **Frontend:**

   ```bash
   cd client
   npm install
   npm run dev
   ```

### Environment Variables

Create `.env` files in both `client/` and `server/` directories:

**Server (.env):**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/codesyncpad
CLIENT_URL=http://localhost:5173
SESSION_TTL_HOURS=24
MAX_ACTIVE_USERS=50
EXECUTION_TIMEOUT_MS=5000
EXECUTION_MEMORY_LIMIT_MB=128
```

**Client (.env):**

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## 🚀 Deployment

### Deploy to Render (Free Tier)

1. **Fork this repository**

2. **Connect to Render**

   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select this repository

3. **Automatic Setup**

   - Render will detect `render.yaml` and automatically:
     - Create a PostgreSQL database
     - Deploy the web service
     - Set up environment variables

4. **Initialize Database**
   ```bash
   # Connect to your Render database and run:
   # Copy contents from server/src/db/schema.sql
   ```

For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

## 💻 Usage

1. **Create a Session**

   - Visit the homepage
   - Click "Create new session"
   - Choose your programming language

2. **Collaborate**

   - Share the session URL with others
   - Start coding together in real-time
   - See typing indicators and user activity

3. **Execute Code**

   - Write JavaScript or Python code
   - Click "Run" to execute in the browser
   - View output in the integrated console

4. **Features**
   - Toggle between light/dark themes
   - View active user count
   - Automatic session persistence

## 🎯 Use Cases

- **Coding Interviews**: Real-time collaborative coding sessions
- **Pair Programming**: Work together on code with instant feedback
- **Teaching**: Interactive coding lessons and demonstrations
- **Code Review**: Collaborate on code snippets and solutions
- **Prototyping**: Quick testing and sharing of code ideas

## 🔧 Development

### Available Scripts

**Frontend (client/):**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend (server/):**

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

### Database Schema

The application uses PostgreSQL with the following main tables:

- `sessions` - Store coding sessions with metadata
- `session_users` - Track active users in sessions

See `server/src/db/schema.sql` for the complete schema.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CodeMirror** - Excellent code editing experience
- **Socket.io** - Seamless real-time communication
- **Pyodide** - Python in the browser via WebAssembly
- **Render** - Easy deployment platform
- **Vite** - Lightning-fast build tool

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/sdhlyhb/ai-dev-tools-zoomcamp-2025/issues) page
2. Create a new issue with detailed information
3. Refer to [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for deployment help

---

**Built with ❤️ by Serena Huang** | _Vibe Coding Project_

> A collaborative coding platform designed for the modern developer workflow
