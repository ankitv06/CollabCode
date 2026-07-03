import express from 'express'
import http from 'http';
import {Server} from 'socket.io';
import { ACTIONS } from './Actions.js';
import { log } from 'console';
import { WebSocketServer } from 'ws';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows your Vercel frontend to connect
        methods: ["GET", "POST"]
    }
});

// Attach WebSocket server for Yjs without binding directly to the server to prevent conflicts
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

// Manually route WebSocket upgrades
server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/socket.io')) {
        // Let socket.io handle its own upgrades
        return;
    }
    // Route other websocket connections to y-websocket
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const userSocketMap = {};
const roomLanguageMap = {};
const deletionTimers = new Map();

function getRandomColor() {
  const colors = [
    '#E06C75', '#61AFEF', '#98C379', '#E5C07B', '#C678DD',
    '#56B6C2', '#BE5046', '#D19A66', '#7EC8E3', '#C3E88D',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getClientList(roomId){ // returns all the clients {socketId, username, color} present in room roomId
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId]?.username,
            color: userSocketMap[socketId]?.color
        }
    })
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    
    socket.on(ACTIONS.JOIN, ({roomId, username})=>{ // if user joins
        const color = getRandomColor();
        userSocketMap[socket.id] = { username, color };
        socket.join(roomId); // join the user in room and

        // Cancel deletion timer if it exists
        if (deletionTimers.has(roomId)) {
            clearTimeout(deletionTimers.get(roomId));
            deletionTimers.delete(roomId);
        }

        // inform all users in cur room that {socket.id, username} joined
        const clients = getClientList(roomId);
        io.to(roomId).emit(ACTIONS.JOINED, {username, socketId: socket.id, clients}); // sending username, socket id, clientList of the user who joined to every client in roomId
    })

    socket.on(ACTIONS.LANG_CHANGE, ({roomId, language}) => {
        roomLanguageMap[roomId] = language;
        socket.in(roomId).emit(ACTIONS.LANG_CHANGE, { language });
    })

    socket.on('request_language', ({roomId}) => {
        if (roomLanguageMap[roomId]) {
            socket.emit(ACTIONS.LANG_CHANGE, { language: roomLanguageMap[roomId] });
        }
    })

    socket.on(ACTIONS.NAME_CHANGE, ({roomId, username}) => {
        if(userSocketMap[socket.id]) {
            userSocketMap[socket.id].username = username;
        }
        const clients = getClientList(roomId);
        io.to(roomId).emit(ACTIONS.NAME_CHANGE, { username, socketId: socket.id, clients });
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms]; // get all rooms that cur socket/user is in

        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, { // and send those rooms {socketId, userID}
                socketId: socket.id,
                username: userSocketMap[socket.id]?.username,
            })
        })
        delete userSocketMap[socket.id]; // delete socket from map
        socket.leave(); // leave the room
        console.log('socket disconnected', socket.id);

        rooms.forEach((roomId) => {
            if (roomId === socket.id) return;
            const remainingClients = getClientList(roomId).filter(c => c.socketId !== socket.id);
            if (remainingClients.length === 0 && !deletionTimers.has(roomId)) {
                const timer = setTimeout(() => {
                    delete roomLanguageMap[roomId];
                    docs.delete(roomId);
                    deletionTimers.delete(roomId);
                    console.log(`Room ${roomId} permanently deleted due to inactivity.`);
                }, 30 * 60 * 1000); // 30 mins
                deletionTimers.set(roomId, timer);
            }
        });
    })
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));