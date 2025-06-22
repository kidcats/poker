import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';

const WebSocketClient: React.FC = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [message, setMessage] = useState('');
  
    useEffect(() => {
      // Connect to the WebSocket server
      const newSocket = io('http://localhost:8080');
      setSocket(newSocket);
  
      // Clean up the WebSocket connection when the component unmounts
      return () => {
        newSocket.disconnect();
      };
    }, []);
  
    const handleSend = () => {
      if (socket) {
        // Send a message to the WebSocket server
        socket.emit('message', 'Hello, server!');
      }
    };
  
    socket?.on('message', (data: string) => {
      setMessage(data);
    });
  
    return (
      <div>
        <h2>WebSocket Client</h2>
        <p>Received message: {message}</p>
        <button onClick={handleSend}>Send Message</button>
      </div>
    );
  };
  
  export default WebSocketClient;