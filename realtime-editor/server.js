import express from 'express'
import http from 'http';
import {Server} from 'socket.io';
import { ACTIONS } from './Actions.js';
import { log } from 'console';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

function getClientList(roomId){ // returns all the clients {socketId, username} present in room roomId
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId]
        }
    })
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    
    socket.on(ACTIONS.JOIN, ({roomId, username})=>{ // if user joins
        userSocketMap[socket.id] = username;
        socket.join(roomId); // join the user in room and

        // inform all users in cur room that {socket.id, username} joined
        const clients = getClientList(roomId);
        io.to(roomId).emit(ACTIONS.JOINED, {username, socketId: socket.id, clients}); // sending username, socket id, clientList of the user who joined to every client in roomId
    })

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms]; // get all rooms that cur socket/user is in

        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, { // and send those rooms {socketId, userID}
                socketId: socket.id,
                username: userSocketMap[socket.id],
            })
        })
        delete userSocketMap[socket.id]; // delete socket from map
        socket.leave(); // leave the room
        console.log('socket disconnected', socket.id);
    })
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));