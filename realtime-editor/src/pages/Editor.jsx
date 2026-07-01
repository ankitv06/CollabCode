import React from 'react'
import { useState } from 'react';
import Client from '../components/Client';
import CodeEditor from '../components/CodeEditor';
import Avatar from 'react-avatar'

function Editor() {
  const [clients, setClients] = useState([
    {socketId: '123', username: 'Rahul Kala'},
    {socketId: '456', username: 'Kushal'},
    {socketId: 'abc', username: 'John Doe'},
  ]);

  return (
        <div className="mainWrap h-screen">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <h1 className='text-green-600  text-4xl'>CollabCode</h1>
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn bg-gray-500 text-white hover:bg-zinc-700" >
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" >
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <CodeEditor
                    
                />
            </div>
        </div>
    )
}

export default Editor