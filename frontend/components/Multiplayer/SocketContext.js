"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const BACKEND_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_DOMAIN;

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [sessionCode, setSessionCode] = useState('');

  const onConnect = () => {
    if (!socket) {
      // Initialize the socket connection
      const newSocket = io(`${BACKEND_DOMAIN}/api`, { secure: true });
      setSocket(newSocket);

      // Listen for 'session created' event
      newSocket.on('session created', (code) => {
        setSessionCode(code);
      });
    }
  }

  const onDisconnect = () => {
    if (socket) {
      socket.off('session created');
      socket.close();
      setSocket(null);
    }
  }

  const onLeaveQuiz = () => {
    if (socket) socket.emit("leave quiz");
  }

  return (
    <SocketContext.Provider value={{ 
      socket, 
      sessionCode, 
      setSessionCode, 
      onConnect, 
      onDisconnect,
      onLeaveQuiz }}>
      {children}
    </SocketContext.Provider>
  );
};