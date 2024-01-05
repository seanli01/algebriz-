'use client'
import styles from "./JoinSessionForm.module.css";
import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import StatusTextbox from '@/components/StatusTextbox/StatusTextbox';

const JoinSessionForm = ({ userId }) => {
  const { socket } = useSocket(); // Use the socket instance from the context
  const [code, setCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [inSession, setInSession] = useState(false);

  useEffect(() => {
    const handleSessionUpdate = (updatedParticipants) => {
      setParticipants(updatedParticipants);
      setInSession(true);
    };

    const handleSessionError = (errorMsg) => {
      setError(errorMsg);
      setInSession(false);
    };

    if(!socket) return

    socket.on('session update', handleSessionUpdate);
    socket.on('session error', handleSessionError);

    return () => {
      socket.off('session update', handleSessionUpdate);
      socket.off('session error', handleSessionError);
    };
  }, [socket]);

  const joinSession = () => {
    setError('');
    socket.emit('join session', { code, userId }, ); // Emit the event to join a session
  };

  return (
    <div className={styles.cont}>
      <div className={styles.caption}>
        { userId ?
          inSession ?
            "Please wait for host to start game.\nDo not leave this page."
            :
            "Enter a game code to join a game!"
          :
          "Sign in with the button in the top right corner\nand start playing!"
        }
      </div>
      { userId && inSession ?
        participants.length > 0 && (
          <div className={styles.lobby_cont}>
            <div className={styles.lobby_title}>Lobby</div>
            <ul className={styles.lobby_list}>
              {participants.map((participant, index) => (
                <li key={index}>
                  {participant}
                </li>
              ))}
            </ul>
          </div>
        )
        :
        <></>
      }
      { userId && !inSession ?
        <>
          <input
            type="text"
            value={code}
            className={styles.code_input}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Session Code"
          />
          <StatusTextbox msg={error} color={"red"} isCentered={true}/>
          <button onClick={joinSession} className={styles.code_btn}>
            Join Quiz
          </button>
        </>
        : 
        <></>
      }
    </div>
  );
};

export default JoinSessionForm;