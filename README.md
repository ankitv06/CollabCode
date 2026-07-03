# CollabCode

CollabCode is a real-time collaborative code editor. It allows multiple developers to join a shared coding room via a unique URL, write code simultaneously without conflicts, and see each other's live cursors in real-time.

## Working Demo: [collabcode](https://collab-code-ecru.vercel.app/)

## ✨ Features

- **Real-Time Collaboration**: Type simultaneously with teammates with zero conflicts, powered by mathematical CRDTs.
- **Live Remote Cursors**: See exactly where your teammates are typing with presence aware cursors.
- **Multi-Language Syntax**: Full syntax highlighting support for Javascript, Python, C++, Java, Rust, HTML, CSS, and more.
- **Active User Tracking**: See who is currently in the room and instantly sync name changes.
- **Seamless Theming**: Beautiful Dark and Light modes that persist across your sessions.
- **Shareable Rooms**: Instantly copy room links to invite peers.
- **Smart Cleanup**: Empty rooms are automatically garbage-collected after 30 minutes of inactivity to save server resources.

## 🛠️ Technology Stack

**Frontend**
- **React (Vite)**: UI rendering and routing.
- **CodeMirror 6**: The robust code editor engine powering the text area and syntax highlighting.
- **Tailwind CSS & Vanilla CSS**

**Backend & Real-Time Sync**
- **Node.js & Express**: The central server routing all data.
- **Yjs & y-websocket**: The brain behind the code synchronization. Yjs mathematically resolves typing conflicts in real-time.
- **Socket.io**: Manages room metadata (user joins/leaves, active user lists, and name changes).

## 🚀 Running Locally

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <your-repo-url>
   cd realtime-editor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following for local development:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   VITE_APP_BACKEND_URL=http://localhost:5000
   ```

4. **Start the Development Server:**
   This project uses a unified script to run both the Vite frontend and the Node backend simultaneously.
   ```bash
   npm run dev:all
   ```

5. Open your browser and navigate to `http://localhost:5173`.

## 💾 Persistence

- **Frontend**: Theme preferences (Dark/Light mode) are persisted in the browser's native `localStorage`.
- **Backend (Code)**: Room state and code are stored **in-memory** on the Node.js server. Code is kept perfectly in sync while users are active, but will be wiped if the server restarts or if the room is empty for 30 minutes.
