import express from 'express'
import http from 'http';
import {Server} from 'socket.io';
import { ACTIONS } from './Actions.js';
import { log } from 'console';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};
const roomLanguageMap = {};

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
    })
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));