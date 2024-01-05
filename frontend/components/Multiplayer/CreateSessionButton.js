'use client'
import "./CreateSessionButton.css"
import React, { useState, useEffect } from 'react';

import { useUserContext } from '@/app/(headFootLayout)/layout';
import { useSocket } from './SocketContext';

const CreateSessionButton = () => {
  const { socket, setSessionCode } = useSocket();
  const [sessionCode1, setSessionCode1] = useState('');
  const userId = useUserContext(); // Retrieve the user ID from context


  useEffect(() => {
    if(!socket) return
    socket.on('session created', (code) => {
      setSessionCode1(code)
      setSessionCode(code);
    });


    return () => socket.off('session created');

  }, [socket]);

  const createSession = () => {
    // Ensure that we have a user ID before trying to create a session
    if (userId) {
      socket.emit('create session', userId, (response) => {
        // Handle the response here, such as setting the session code
        if (response) {
          setSessionCode1(response)
          setSessionCode(response);
        }
      });
    }
  }

  return (
    <div className="session-section">
      <button className="session-button" onClick={createSession}>Create Lobby</button>
      {sessionCode1 && <p>Session Code: {sessionCode1}</p>}
    </div>
  );
};

export default CreateSessionButton;