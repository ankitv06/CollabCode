import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 5,
        timeout: 1000,
        transports: ['websocket'],
    };
    return io(import.meta.env.VITE_APP_BACKEND_URL, options);
};