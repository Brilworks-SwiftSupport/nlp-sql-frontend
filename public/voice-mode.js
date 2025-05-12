class VoiceMode {
    constructor(options) {
      this.options = options;
      this.isListening = false;
      this.isProcessing = false;
      this.isSpeaking = false;
      this.mediaRecorder = null;
      this.socket = null;
      this.audioContext = null;
      this.stream = null;
      this.audioChunks = [];
      this.userStopped = false;
      this.audioQueue = [];
      this.isPlaying = false;
      this.silenceStart = null;
      this.silenceTimer = null;
      this.analyser = null;
      this.dataArray = null;
      this.animationFrameId = null;
  
      this.modal = null;
      this.canvas = null;
      this.canvasContext = null;
      this.statusText = null;
      this.button = null;
      this.micCircle = null;
  
      this.initModal();
    }
  
    initModal() {
      this.modal = document.createElement('div');
      this.modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
      this.modal.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-xl font-semibold">Voice Mode</h2>
              <button class="close-button p-2 hover:bg-gray-100 rounded-full">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="flex flex-col items-center justify-center h-64">
              <div class="mb-4 w-full max-w-md h-24 bg-gray-50 rounded-lg overflow-hidden">
                <canvas class="visualizer" width="500" height="100"></canvas>
              </div>
              <div class="mic-circle w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8">
                <div class="mic-inner w-24 h-24 rounded-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                </div>
              </div>
              <p class="status-text text-lg text-gray-600 mb-8"></p>
              <button class="toggle-button px-6 py-3 rounded-full text-white font-medium">
                Start Speaking
              </button>
            </div>
          </div>
        </div>
      `;
  
      this.canvas = this.modal.querySelector('.visualizer');
      this.canvasContext = this.canvas.getContext('2d');
      this.statusText = this.modal.querySelector('.status-text');
      this.button = this.modal.querySelector('.toggle-button');
      this.micCircle = this.modal.querySelector('.mic-circle');
      this.micInner = this.modal.querySelector('.mic-inner');
  
      this.modal.querySelector('.close-button').addEventListener('click', () => this.close());
      this.button.addEventListener('click', () => this.toggleListening());
  
      document.body.appendChild(this.modal);
    }
  
    setState(newState) {
      Object.assign(this, newState);
      this.updateUI();
    }
  
    updateUI() {
      // Update button
      if (this.isListening || this.isProcessing) {
        this.button.textContent = 'Stop';
        this.button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        this.button.classList.add('bg-red-500', 'hover:bg-red-600');
      } else {
        this.button.textContent = 'Start Speaking';
        this.button.classList.remove('bg-red-500', 'hover:bg-red-600');
        this.button.classList.add('bg-blue-500', 'hover:bg-blue-600');
      }
      this.button.disabled = this.isSpeaking;
  
      // Update status text
      this.statusText.textContent = this.isListening ? 'Listening...' :
        this.isProcessing ? 'Recording...' :
        this.isSpeaking ? 'Speaking...' : 'Tap to speak';
  
      // Update microphone circle
      const borderColor = this.isListening ? 'border-blue-500' :
        this.isProcessing ? 'border-yellow-500' :
        this.isSpeaking ? 'border-green-500' : 'border-gray-300';
      const bgColor = this.isListening ? 'bg-blue-500' :
        this.isProcessing ? 'bg-yellow-500' :
        this.isSpeaking ? 'bg-green-500' : 'bg-gray-300';
  
      this.micCircle.className = `mic-circle w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 ${borderColor}`;
      this.micInner.className = `mic-inner w-24 h-24 rounded-full flex items-center justify-center ${bgColor}`;
  
      if (this.isListening) {
        this.micCircle.classList.add('animate-pulse');
      } else {
        this.micCircle.classList.remove('animate-pulse');
      }
    }
  
    open() {
      this.modal.classList.remove('hidden');
      this.initSocket();
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  
    close() {
      this.cleanupAll();
      this.modal.classList.add('hidden');
      if (this.options.onClose) this.options.onClose();
    }
  
    initSocket() {
      this.socket = io(this.options.socketUrl || 'http://127.0.0.1:5000', {
        path: '/socket.io',
        transports: ['websocket']
      });
  
      this.socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        this.socket.emit('join', { conversation_id: this.options.conversationId });
      });
  
      this.socket.on('audio_response', (data) => this.handleAudioResponse(data));
      this.socket.on('error', (error) => this.handleError(error));
    }
  
    async startListening() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioContext.createMediaStreamSource(this.stream);
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        source.connect(this.analyser);
        
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        await this.audioContext.resume();
        
        this.setState({ isListening: true });
        this.drawWaveform();
      } catch (err) {
        console.error('🚫 Error accessing microphone:', err);
      }
    }
  
    drawWaveform() {
      if (!this.analyser) return;
  
      this.analyser.getByteTimeDomainData(this.dataArray);
      const rms = Math.sqrt(
        this.dataArray.reduce((sum, val) => {
          const norm = (val - 128) / 128;
          return sum + norm * norm;
        }, 0) / this.dataArray.length
      );
  
      const threshold = 0.225;
      const now = Date.now();
      const isSilent = rms < threshold;
  
      // Silence detection logic
      if (!isSilent) {
        this.silenceStart = null;
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
        if (!this.mediaRecorder) {
          this.startRecording();
        }
      } else if (this.mediaRecorder?.state === 'recording') {
        if (!this.silenceStart) {
          this.silenceStart = now;
        } else if (now - this.silenceStart >= 1500 && !this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.stopRecording();
            this.silenceTimer = null;
          }, 0);
        }
      }
  
      // Draw visualization
      this.canvasContext.fillStyle = this.isListening ? 'rgba(59, 130, 246, 0.1)' : 'rgba(209, 213, 219, 0.1)';
      this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvasContext.lineWidth = 2;
      this.canvasContext.strokeStyle = this.isListening ? '#3B82F6' :
        this.isProcessing ? '#F59E0B' :
        this.isSpeaking ? '#10B981' : '#9CA3AF';
      
      this.canvasContext.beginPath();
      const slice = this.canvas.width / this.dataArray.length;
      let x = 0;
      
      this.dataArray.forEach((val, i) => {
        const v = val / 128.0;
        const y = (v * this.canvas.height) / 2;
        i === 0 ? this.canvasContext.moveTo(x, y) : this.canvasContext.lineTo(x, y);
        x += slice;
      });
      
      this.canvasContext.lineTo(this.canvas.width, this.canvas.height / 2);
      this.canvasContext.stroke();
  
      this.animationFrameId = requestAnimationFrame(() => this.drawWaveform());
    }
  
    startRecording() {
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm; codecs=opus' });
  
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
  
      this.mediaRecorder.onstop = async () => {
        if (this.userStopped) {
          this.cleanupRecording();
          return;
        }
  
        const blob = new Blob(this.audioChunks, { type: 'audio/webm; codecs=opus' });
        const buffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        const b64 = btoa(String.fromCharCode.apply(null, uint8));
        
        this.socket.emit('audio_stream', {
          conversation_id: this.options.conversationId,
          audio: b64
        });
        
        this.socket.emit('audio_stream_end', {
          conversation_id: this.options.conversationId,
          connection_id: this.options.selectedConnectionId,
          pairs: this.options.pairs.filter(p => p.table && p.column && p.value)
        });
  
        this.cleanupRecording();
      };
  
      this.mediaRecorder.start();
      this.setState({ isProcessing: true, isListening: false });
    }
  
    stopRecording() {
      if (this.mediaRecorder?.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }
  
    async stopListening() {
      this.userStopped = true;
      this.stopRecording();
      this.setState({ isListening: false, isProcessing: false });
      this.audioQueue = [];
      
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      await this.audioContext?.suspend();
      this.cleanupRecording();
    }
  
    cleanupRecording() {
      this.audioChunks = [];
      this.mediaRecorder = null;
      this.setState({ isProcessing: false, isListening: false });
      this.userStopped = false;
    }
  
    cleanupAll() {
      this.stopRecording();
      this.stream?.getTracks().forEach(track => track.stop());
      this.socket?.emit('leave', { conversation_id: this.options.conversationId });
      this.socket?.disconnect();
      
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      this.audioContext?.close();
      this.audioQueue = [];
    }
  
    async handleAudioResponse({ audio, text }) {
      this.audioQueue.push(audio);
      if (!this.isPlaying) {
        await this.playNextInQueue();
      }
      if (this.options.refreshMessages) {
        await this.options.refreshMessages();
      }
    }
  
    async playNextInQueue() {
      if (this.audioQueue.length === 0) {
        this.isPlaying = false;
        this.setState({ isSpeaking: false });
        return;
      }
  
      this.isPlaying = true;
      this.setState({ isSpeaking: true });
  
      try {
        const data = this.audioQueue.shift();
        const buffer = await this.base64ToArrayBuffer(data);
        const decoded = await this.audioContext.decodeAudioData(buffer);
        const source = this.audioContext.createBufferSource();
        source.buffer = decoded;
        source.connect(this.audioContext.destination);
        source.onended = () => this.playNextInQueue();
        source.start();
      } catch (err) {
        console.error('🎧 Error playing audio:', err);
        this.setState({ isSpeaking: false });
        this.isPlaying = false;
      }
    }
  
    base64ToArrayBuffer(base64) {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }
  
    handleError(error) {
      console.error('WebSocket error:', error);
      this.setState({ isProcessing: false, isSpeaking: false });
    }
  
    toggleListening() {
      if (this.isListening || this.isProcessing) {
        this.stopListening();
      } else {
        this.startListening();
      }
    }
  }