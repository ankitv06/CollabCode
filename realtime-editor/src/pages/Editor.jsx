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
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [localUsername, setLocalUsername] = useState(location.state?.username || '');

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

            socketRef.current.on(ACTIONS.NAME_CHANGE, ({ clients }) => {
                setClients(clients);
            });
        };
        init();

        return () => {
            active = false;
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.NAME_CHANGE);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }; 
    }, [])

    if(!location.state) return <Navigate to='/'/>

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    const handleNameChange = (e) => {
        setLocalUsername(e.target.value);
    };

    const handleNameBlur = () => {
        if(socketRef.current) {
            socketRef.current.emit(ACTIONS.NAME_CHANGE, { roomId, username: localUsername });
            
            // Also explicitly update the local user in the clients list to immediately reflect
            setClients(prev => prev.map(c => 
                c.socketId === socketRef.current.id ? {...c, username: localUsername} : c
            ));
        }
    };

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const localClient = clients.find(c => c.socketId === socketRef.current?.id);
    const localColor = localClient?.color;

    return (
            <div className={`mainWrap h-screen ${!isDarkMode ? 'light-mode' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="aside">
                    <div className="asideInner">
                        <div className="logo">
                            {!isCollapsed && <h1 className='text-green-600 text-2xl'>CollabCode</h1>}
                            <button onClick={() => setIsCollapsed(!isCollapsed)} className="collapseBtn">
                                {isCollapsed ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                )}
                            </button>
                        </div>
                        
                        <div className="themeToggleWrapper" title="Toggle Dark Mode" onClick={isCollapsed ? toggleTheme : undefined} style={{ cursor: isCollapsed ? 'pointer' : 'default' }}>
                            {!isCollapsed && <span>Dark Mode</span>}
                            {isCollapsed ? (
                                isDarkMode ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                                )
                            ) : (
                                <label className="toggleSwitch">
                                    <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} />
                                    <span className="slider round"></span>
                                </label>
                            )}
                        </div>

                        <div className="shareLinkWrapper" title="Copy Room ID">
                            {!isCollapsed && <span className="shareTitle">Share Room</span>}
                            <div className="shareInputBox">
                                {!isCollapsed && <input type="text" value={roomId} readOnly />}
                                <button onClick={copyRoomId}>
                                    {isCollapsed ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    ) : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="activeUsersWrapper">
                            {!isCollapsed && <span className="activeUsersTitle">Active Users</span>}
                            <div className="activeUsersList">
                                {clients.map((client) => {
                                    const isLocalUser = socketRef.current && client.socketId === socketRef.current.id;
                                    return (
                                        <div className="userRow" key={client.socketId} title={client.username}>
                                            <Avatar size="24" round="12px" textSizeRatio={2.3} name={isLocalUser ? localUsername : client.username} />
                                            {!isCollapsed && (
                                                isLocalUser ? (
                                                    <div className="localUserEdit">
                                                        <input 
                                                            type="text" 
                                                            value={localUsername} 
                                                            onChange={handleNameChange}
                                                            onBlur={handleNameBlur}
                                                            onKeyDown={handleNameKeyDown}
                                                            className="editableUsername"
                                                            style={{ color: localColor }}
                                                        />
                                                        <span className="youLabel">(you)</span>
                                                    </div>
                                                ) : (
                                                    <span className="remoteUsername" style={{ color: client.color }}>{client.username}</span>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <button className="btn leaveBtn" onClick={leaveRoom} title="Leave Room">
                        {isCollapsed ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        ) : 'Leave'}
                    </button>
                </div>
                <div className="editorWrap">
                    <CodeEditor
                        roomId={roomId}
                        username={localUsername}
                        color={localColor}
                        theme={isDarkMode ? 'dark' : 'light'}
                        socketRef={socketRef}
                    />
                </div>
            </div>
        )
}

export default Editor