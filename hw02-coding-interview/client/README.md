# CollabCodePad Frontend

A real-time collaborative code editor built with React, Vite, and CodeMirror. Share code instantly with unique session links and collaborate in real-time.

## Features

- **Real-Time Collaboration**: Multiple users can edit code simultaneously with live synchronization
- **Shareable Sessions**: Generate unique session links to share with collaborators
- **Syntax Highlighting**: Support for JavaScript and Python with CodeMirror
- **Theme Support**: Toggle between light and dark themes
- **Connection Status**: Visual indicators for connection state and active users
- **Demo Mode**: Try the editor instantly with a pre-populated demo session
- **Auto-Reconnection**: Automatic WebSocket reconnection on connection loss

## Tech Stack

- **React 18.2.0** - UI framework
- **Vite 5.0.8** - Build tool and dev server
- **CodeMirror** - Code editor component
- **React Router DOM** - Client-side routing
- **Socket.io Client** - Real-time WebSocket communication

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:3000` (or configure in `.env`)

### Installation

1. Clone the repository and navigate to the client folder:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Create environment configuration (optional):

```bash
cp .env.example .env
```

Edit `.env` to configure API and WebSocket URLs if different from defaults.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
client/
├── src/
│   ├── api/
│   │   └── session.js          # API client for backend communication
│   ├── components/
│   │   ├── Editor.jsx          # CodeMirror editor component
│   │   ├── Editor.css
│   │   ├── Header.jsx          # Top navigation bar
│   │   └── Header.css
│   ├── hooks/
│   │   └── useWebSocket.js     # Custom hook for WebSocket connection
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── EditorPage.jsx      # Main editor page
│   │   └── EditorPage.css
│   ├── App.jsx                 # Root component with routing
│   ├── App.css
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles and theme
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Key Features Explained

### Session Management

- Create new sessions with unique IDs
- Join existing sessions via URL (`/session/:sessionId`)
- Demo session with pre-populated Fibonacci code

### Real-Time Sync

- WebSocket connection for instant code updates
- User presence tracking (join/leave notifications)
- Automatic reconnection with 3-second timeout
- Debounced code updates (300ms) to reduce network traffic

### Editor Features

- Language selection (JavaScript, Python)
- Syntax highlighting with CodeMirror
- Line numbers and code folding
- Auto-completion and bracket matching
- Full keyboard shortcuts support

### UI/UX

- Responsive design for mobile and desktop
- Light/dark theme with CSS variables
- Toast notifications for events (users joining/leaving, errors)
- Copy session link to clipboard
- Connection status indicator with pulse animation

## Mock Backend Mode

The current implementation includes a **mock backend** for development and testing without a real server:

- **Mock API** (`src/api/session.js`): In-memory Map-based session storage
- **Mock WebSocket** (`src/hooks/useWebSocket.js`): Simulated Socket.io connection

To use with a real backend:

1. Replace mock functions in `src/api/session.js` with actual API calls
2. Remove the mock socket logic from `src/hooks/useWebSocket.js`
3. Update `.env` with your backend URL

## Environment Variables

| Variable                    | Description          | Default                 |
| --------------------------- | -------------------- | ----------------------- |
| `VITE_API_BASE_URL`         | Backend API URL      | `http://localhost:3000` |
| `VITE_WS_URL`               | WebSocket server URL | `http://localhost:3000` |
| `VITE_APP_NAME`             | Application name     | `CollabCodePad`         |
| `VITE_SESSION_EXPIRY_HOURS` | Session TTL in hours | `24`                    |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

The app can be deployed to any static hosting service:

1. Build the app: `npm run build`
2. Deploy the `dist/` folder to your hosting provider

Popular options:

- Vercel: `vercel deploy`
- Netlify: `netlify deploy`
- Docker: Use the provided Dockerfile

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues or questions:

- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ using React + Vite
