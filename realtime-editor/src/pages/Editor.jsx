import React, { useEffect, useRef } from 'react'
import { useState } from 'react';
import Client from '../components/Client';
import CodeEditor from '../components/CodeEditor';
import Avatar from 'react-avatar'
import { initSocket } from '../socket';
import { ACTIONS } from '../../Actions';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { func } from 'prop-types';

function Editor() {
    const socketRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
    const {editorId: roomId} = useParams();

    const [clients, setClients] = useState([]);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied!');
        } catch (error) {
            toast.error('Could not copy Room ID.');
            console.log(error);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    useEffect(() => {
        let active = true;

        const init = async () => {
            const socket = await initSocket();

            if (!active) {
                socket.disconnect();
                return;
            }

            socketRef.current = socket;

            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username
            });

            socketRef.current.on(ACTIONS.JOINED, ({socketId, username, clients}) => {
                if(username !== location.state?.username){
                    toast.success(`${username} has joined the room!`);
                    console.log(`${username} joined`);
                }
                setClients(clients);
            })

            socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId, username}) => {
                toast.success(`${username} has left the room.`);
                console.log(`${username} left`);
                
                setClients((prev) => {
                    return prev.filter( (client) => client.socketId !== socketId );
                })
            })
        };
        init();

        return () => {
            active = false;
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }; 
    }, [])

    if(!location.state) return <Navigate to='/'/>

    return (
            <div className="mainWrap h-screen">
                <div className="aside">
                    <div className="asideInner">
                        <div className="logo mb-3">
                            <h1 className='text-green-600  text-4xl'>CollabCode</h1>
                        </div>
                        <div className="clientsList">
                            {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                />
                            ))}
                        </div>
                    </div>
                    <button className="btn bg-zinc-700 text-white hover:bg-gray-600" onClick={copyRoomId} >
                        Copy ROOM ID
                    </button>
                    <button className="btn leaveBtn" onClick={leaveRoom}>
                        Leave
                    </button>
                </div>
                <div className="editorWrap">
                    <CodeEditor
                        roomId={roomId}
                        username={location.state?.username}
                        socketRef={socketRef}
                    />
                </div>
            </div>
        )
}

export default Editor