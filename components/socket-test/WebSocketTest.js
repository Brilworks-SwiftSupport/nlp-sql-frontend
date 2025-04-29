import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const WebSocketTest = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('❌ Disconnected');

  useEffect(() => {
    // Connect to your backend
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      path: '/socket.io',
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setConnectionStatus('✅ Connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setConnectionStatus('❌ Disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus(`❌ Connection Error: ${error.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendPing = () => {
    if (socket) {
      socket.emit('ping', { message: 'Ping from React!' }, (response) => {
        console.log('✅ Pong received from server:', response);
        setMessage(response.message);
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">WebSocket Test</h2>
        
        <div className="mb-4">
          <p className="text-lg">Status: <span className="font-mono">{connectionStatus}</span></p>
        </div>

        <div className="mb-6">
          <button 
            onClick={sendPing}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            disabled={!socket}
          >
            Send Ping
          </button>
        </div>

        {message && (
          <div className="bg-gray-100 p-4 rounded">
            <p className="font-mono">Server response: {message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketTest;