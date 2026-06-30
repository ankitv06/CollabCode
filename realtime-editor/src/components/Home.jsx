import React, { useState } from 'react'
import {v4 as uuidv4} from 'uuid'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Editor from './Editor'
import toast from 'react-hot-toast'

function Home() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('')
    const [username, setUsername] = useState('')

    const createNewRoom = (e)=>{
        e.preventDefault();
        const id = uuidv4();
        setRoomId(id);
        navigator.clipboard.writeText(id);
        toast.success("New Room ID copied!")
    }

    const switchPage = ()=>{
        if(!roomId || !username) toast.error("Room ID and Username are mandatory fields");
        else{
            navigate(`/editor/${roomId}`, {
                state: {username,},
            })
        }
    }

    const handleInputEnter = (e)=>{
        if(e.code == 'Enter') switchPage();        
    }

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <h1 className='text-green-500 text-3xl'>CollabCode</h1>
                <p className='text-sm '>A real-time collaborative code editor</p>

                <div className="inputGroup">
                    <h4 className="pt-4 pb-2">Paste invitation Room ID</h4>
                    <input
                        type="text"
                        className="inputBox text-gray-800"
                        placeholder="ROOM ID"
                        value={roomId}
                        onChange={(e)=>{setRoomId(e.target.value)}}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox text-gray-800"
                        placeholder="USERNAME"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={switchPage}>
                        Join
                    </button>
                    <span className="createInfo">
                        If you don't have an invite then create &nbsp;
                        <a
                            onClick={createNewRoom}
                            href=""
                            className="createNewBtn"
                        >
                            new room
                        </a>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default Home