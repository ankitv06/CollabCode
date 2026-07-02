import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Home() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('')
    const [username, setUsername] = useState('')
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const newTheme = !prev;
            localStorage.setItem('theme', newTheme ? 'dark' : 'light');
            return newTheme;
        });
    };

    const createRoom = () => {
        if (!username) {
            toast.error("Username is required");
            return;
        }
        const id = uuidv4();
        navigate(`/editor/${id}`, { state: { username } });
    }

    const joinRoom = () => {
        if (!username) {
            toast.error("Username is required");
            return;
        }
        if (!roomId) {
            toast.error("Room ID is required to join");
            return;
        }
        
        let finalRoomId = roomId;
        if (roomId.includes('/editor/')) {
            finalRoomId = roomId.split('/editor/')[1].trim();
        }
        
        navigate(`/editor/${finalRoomId}`, { state: { username } });
    }

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            if (roomId) joinRoom();
            else createRoom();
        }
    }

    return (
        <div className={`homeWrapper ${!isDarkMode ? 'light-mode' : ''}`}>
            {/* Top Bar containing Logo and Theme Toggler */}
            <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="logoBrackets">&lt;&gt;</span>
                    <span className="collabLogo">collabcode</span>
                </div>
                <div className="homeThemeToggle" onClick={toggleTheme} title="Toggle Dark Mode" style={{ position: 'static' }}>
                     {isDarkMode ? (
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                     ) : (
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                     )}
                </div>
            </div>

            <div className="homeHero">
                <h1 className="homeTitle">&lt; Start Coding /&gt;</h1>
                <p className="homeSubtitle">Create a new collaborative editor or join an existing room.</p>
                
                <div className="homeInputs">
                    <input
                        type="text"
                        className="homeInput"
                        placeholder="USERNAME"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="homeInput"
                        placeholder="Paste invite link or Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        onKeyUp={handleInputEnter}
                    />
                </div>

                <div className="homeButtons">
                    <button className="homeBtn primary" onClick={createRoom}>
                        Create Room
                    </button>
                    <button className="homeBtn secondary" onClick={joinRoom} disabled={!roomId}>
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Home