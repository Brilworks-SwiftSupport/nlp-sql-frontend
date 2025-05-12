import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from '../../lib/api';

const PublicVoiceAssistant = ({ 
  isOpen, 
  onClose, 
  onMessageSent, 
  conversationId,
  selectedConnectionId,
  pairs,
  refreshMessages 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorder = useRef(null);
  const socketRef = useRef(null);
  const audioContext = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const userStoppedRef = useRef(false);

  const audioQueue = useRef([]);
  const isPlaying = useRef(false);
  const silenceStart = useRef(null);
  const silenceTimer = useRef(null);

  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  
  // Add state for waveform data
  const [waveformData, setWaveformData] = useState(new Uint8Array(0));

  useEffect(() => {
    socketRef.current = io(process.env.SOCKET_API_URL || 'http://127.0.0.1:5000', {
      path: '/socket.io', transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      socketRef.current.emit('join', { conversation_id: conversationId });
    });
    socketRef.current.on('disconnect', () => console.log('❌ Disconnected'));
    socketRef.current.on('audio_response', handleAudioResponse);
    socketRef.current.on('error', handleError);

    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

    return () => {
      cleanupAll();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('join', { conversation_id: conversationId });
    }
    return () => {
      socketRef.current?.emit('leave', { conversation_id: conversationId });
    };
  }, [conversationId]);

  const cleanupAll = () => {
    if (mediaRecorder.current?.state === 'recording') mediaRecorder.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    socketRef.current?.emit('leave', { conversation_id: conversationId });
    socketRef.current?.disconnect();
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    audioContext.current?.close();
    audioQueue.current = [];
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = audioContext.current.createMediaStreamSource(stream);
      if (!analyserRef.current) {
        analyserRef.current = audioContext.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
      }
      source.connect(analyserRef.current);
      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      }

      await audioContext.current.resume();
      setIsListening(true);
      drawWaveform();
    } catch (err) {
      console.error('🚫 Error accessing microphone:', err);
    }
  };

  const drawWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    analyser.getByteTimeDomainData(dataArrayRef.current);
    const rms = Math.sqrt(
      dataArrayRef.current.reduce((sum, val) => {
        const norm = (val - 128) / 128;
        return sum + norm * norm;
      }, 0) / dataArrayRef.current.length
    );
    const threshold = 0.075;
    const now = Date.now();
    const isSilent = rms < threshold;

    if (!isSilent) {
      silenceStart.current = null;
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      if (!mediaRecorder.current) {
        startRecording();
      }
    } else {
      if (mediaRecorder.current?.state === 'recording') {
        if (!silenceStart.current) {
          silenceStart.current = now;
        } else if (now - silenceStart.current >= 1500 && !silenceTimer.current) {
          silenceTimer.current = setTimeout(() => {
            stopRecording();
            silenceTimer.current = null;
          }, 0);
        }
      }
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const { width, height } = canvasRef.current;
      ctx.fillStyle = isListening ? 'rgba(59, 130, 246, 0.1)' : 'rgba(209, 213, 219, 0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isListening
        ? '#3B82F6'
        : isProcessing
          ? '#F59E0B'
          : isSpeaking
            ? '#10B981'
            : '#9CA3AF';
      ctx.beginPath();
      const slice = width / dataArrayRef.current.length;
      let x = 0;
      dataArrayRef.current.forEach((val, i) => {
        const v = val / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      });
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    animationFrameId.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = () => {
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm; codecs=opus' });
    recorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      if (userStoppedRef.current) {
        audioChunksRef.current = [];
        mediaRecorder.current = null;
        setIsProcessing(false);
        setIsListening(false);
        userStoppedRef.current = false;
        return;
      }

      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
      const buffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const b64 = btoa(String.fromCharCode.apply(null, uint8));
      socketRef.current.emit('audio_stream', {
        conversation_id: conversationId,
        audio: b64,
      });
      socketRef.current.emit('audio_stream_end', {
        conversation_id: conversationId,
        connection_id: selectedConnectionId,
        pairs: pairs.filter(p => p.table && p.column && p.value),
      });
      audioChunksRef.current = [];
      mediaRecorder.current = null;
      setIsProcessing(false);
      setIsListening(true);
    };

    mediaRecorder.current = recorder;
    recorder.start();
    setIsProcessing(true);
    setIsListening(false);
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
  };

  const stopListening = async () => {
    userStoppedRef.current = true;
    stopRecording();
    setIsListening(false);
    setIsProcessing(false);
    audioQueue.current = [];
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    silenceStart.current = null;
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    await audioContext.current.suspend();
  };

  const handleAudioResponse = async ({ audio, text }) => {
    audioQueue.current.push(audio);
    if (!isPlaying.current) {
      await playNextInQueue();
    }
    await refreshMessages();
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
      const data = audioQueue.current.shift();
      const buffer = await base64ToArrayBuffer(data);
      const decoded = await audioContext.current.decodeAudioData(buffer);
      const source = audioContext.current.createBufferSource();
      source.buffer = decoded;
      source.connect(audioContext.current.destination);
      source.onended = playNextInQueue;
      source.start();
    } catch (err) {
      console.error('🎧 Error playing audio:', err);
      setIsSpeaking(false);
      isPlaying.current = false;
    }
  };

  const base64ToArrayBuffer = base64 => {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };

  const handleError = error => {
    console.error('WebSocket error:', error);
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold">Voice Mode</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center h-64">
            <div className="mb-4 w-full max-w-md h-24 bg-gray-50 rounded-lg overflow-hidden">
              <canvas ref={canvasRef} width="500" height="100" className="w-full h-full" />
            </div>

            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 ${
              isListening
                ? 'border-blue-500 animate-pulse'
                : isProcessing
                ? 'border-yellow-500'
                : isSpeaking
                ? 'border-green-500'
                : 'border-gray-300'
            }`}>
              <div className={`w-24 h-24 rounded-full ${
                isListening
                  ? 'bg-blue-500'
                  : isProcessing
                  ? 'bg-yellow-500'
                  : isSpeaking
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } flex items-center justify-center`}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-8">
              {isListening
                ? 'Listening...'
                : isProcessing
                ? 'Recording...'
                : isSpeaking
                ? 'Speaking...'
                : 'Tap to speak'}
            </p>

            <button
              onClick={isListening || isProcessing ? stopListening : startListening}
              disabled={isSpeaking}
              className={`px-6 py-3 rounded-full text-white font-medium ${
                isListening || isProcessing
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isListening || isProcessing ? 'Stop' : 'Start Speaking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicVoiceAssistant;
