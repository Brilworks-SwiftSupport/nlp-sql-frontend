import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from '../../lib/api';

const VoiceMode = ({ 
  isOpen, 
  onClose, 
  onMessageSent, 
  conversationId,
  selectedConnectionId,
  pairs 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorder = useRef(null);
  const socketRef = useRef(null);
  const audioContext = useRef(null);
  const audioQueue = useRef([]);
  const isPlaying = useRef(false);

  useEffect(() => {
    // Initialize Socket.IO connection
    socketRef.current = io('http://127.0.0.1:5000', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      // Join the conversation room
      socketRef.current.emit('join', { conversation_id: conversationId });
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    // Handle incoming audio responses
    socketRef.current.on('audio_response', handleAudioResponse);
    socketRef.current.on('error', handleError);

    // Initialize AudioContext for playing responses
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

    return () => {
      // Leave the conversation room
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leave', { conversation_id: conversationId });
      }
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop();
      }
      socketRef.current?.disconnect();
      audioContext.current?.close();
    };
  }, []); // conversationId is stable during modal lifecycle


useEffect(() => {
  const socket = socketRef.current;
  if (!socket || !conversationId) return;

  console.log('👥 Joining room', conversationId);
  socket.emit('join', { conversation_id: conversationId });

  return () => {
    console.log('👋 Leaving room', conversationId);
    socket.emit('leave', { conversation_id: conversationId });
  };
}, [conversationId]);
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      });
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm; codecs=opus',
      });

      mediaRecorder.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const arrayBuffer = await event.data.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64String = btoa(String.fromCharCode(...uint8Array));
          
          console.log('🔵 Sending audio chunk to server', { conversationId });

          socketRef.current.emit('audio_stream', {
            conversation_id: conversationId,
            audio: base64String,
          });
        }
      };

      // Set a smaller timeslice for more frequent chunks (e.g., every 250ms)
      setIsListening(true);
      mediaRecorder.current.start(250);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const stopListening = async () => {
    if (mediaRecorder.current?.state === 'recording') {
      setIsListening(false);
      mediaRecorder.current.stop();
      
      // Stop all tracks in the stream
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      await wait(500);
      socketRef.current.emit('audio_stream_end', {
        conversation_id: conversationId,
        connection_id: selectedConnectionId,
        pairs: pairs.filter(pair => pair.table && pair.column && pair.value)
      });
    }
  };

  const handleAudioResponse = async ({ audio, text }) => {
    console.log('🟢 Received audio response from server', { text });

    // Add the audio to the queue
    audioQueue.current.push(audio);
    
    // Notify the chat interface about the text response
    await onMessageSent(text);
    
    // Play audio if not already playing
    if (!isPlaying.current) {
      playNextInQueue();
    }
  };

  const playNextInQueue = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlaying.current = true;
    setIsSpeaking(true);

    try {
      const audioData = audioQueue.current.shift();
      const arrayBuffer = await base64ToArrayBuffer(audioData);
      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
      
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      
      source.onended = () => {
        playNextInQueue();
      };
      
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      isPlaying.current = false;
    }
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleError = (error) => {
    console.error('WebSocket error:', error);
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold">Voice Mode</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Voice Interface */}
          <div className="flex flex-col items-center justify-center h-64">
            {/* Circular Animation */}
            <div
              className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 ${
                isListening
                  ? 'border-blue-500 animate-pulse'
                  : isProcessing
                  ? 'border-yellow-500'
                  : isSpeaking
                  ? 'border-green-500'
                  : 'border-gray-300'
              }`}
            >
              <div
                className={`w-24 h-24 rounded-full ${
                  isListening
                    ? 'bg-blue-500'
                    : isProcessing
                    ? 'bg-yellow-500'
                    : isSpeaking
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                } flex items-center justify-center`}
              >
                {isListening ? (
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Status Text */}
            <p className="text-lg text-gray-600 mb-8">
              {isListening
                ? 'Listening...'
                : isProcessing
                ? 'Processing...'
                : isSpeaking
                ? 'Speaking...'
                : 'Tap to speak'}
            </p>

            {/* Control Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing || isSpeaking}
              className={`px-6 py-3 rounded-full text-white font-medium ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : isProcessing || isSpeaking
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isListening ? 'Stop' : 'Start Speaking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMode;
