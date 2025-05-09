
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = "http://127.0.0.1:5000/nlpsql";

const PublicAIAssistant = () => {
  const router = useRouter();
  const { id } = router.query;
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isConversationListOpen, setIsConversationListOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const showSuccess = (message) => {
    // Check if toast is available
    if (typeof toast !== 'undefined') {
      toast.success(message);
    } else {
      // Fallback to alert if toast is not available
      console.log('Success:', message);
    }
  };
  
  const showError = (message) => {
    // Check if toast is available
    if (typeof toast !== 'undefined') {
      toast.error(message);
    } else {
      // Fallback to alert if toast is not available
      console.error('Error:', message);
    }
  };

  const handlePdfDownload = (base64Data, filename) => {
    try {
      console.log('PDF download initiated with filename:', filename);
      console.log('Base64 data length:', base64Data ? base64Data.length : 0);
      
      if (!base64Data || base64Data.length === 0) {
        showError('No PDF data available to download');
        return;
      }
      
      // Remove data URL prefix if present
      let cleanBase64 = base64Data;
      if (base64Data.startsWith('data:application/pdf;base64,')) {
        cleanBase64 = base64Data.substring('data:application/pdf;base64,'.length);
      }
      
      // Convert base64 to blob
      try {
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        console.log('Blob created with size:', blob.size);
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success notification
        showSuccess('PDF downloaded successfully');
      } catch (e) {
        console.error('Error decoding base64:', e);
        showError('Invalid PDF data format');
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      console.error('Error details:', error.message);
      showError('Failed to download PDF: ' + error.message);
    }
  };

  const applyMarkdown = (text) => {
    if (!text) return '';
    
    // Format numbered lists (e.g., 1. Item)
    text = text.replace(/^(\d+)\.\s(.+)$/gm, '<ol start="$1"><li>$2</li></ol>');
    
    // Format bullet points
    text = text.replace(/^\*\s(.+)$/gm, '<ul><li>$1</li></ul>');
    
    // Format headers (e.g., # Header)
    text = text.replace(/^#\s(.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
    
    // Format bold text
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic text
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Format code blocks
    text = text.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
    
    // Format inline code
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Format links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Replace newlines with <br> tags
    text = text.replace(/\n/g, '<br>');
    
    return text;
  };
  const createNewConversation = async () => {
    try {
      // Create a title with current date and time
      const now = new Date();
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString();
      const title = `Chat_${formattedDate}_${formattedTime}`;
      
      const response = await axios.post(`${API_URL}/conversations/public`, {
        title: title,
        connection_id: id
      });
      
      if (response.data.status === 'success') {
        const newConversation = response.data.conversation;
        
        // Store conversation ID in localStorage
        localStorage.setItem(`publicConversation_${id}`, newConversation.id);
        
        // Set the new conversation
        setCurrentConversation(newConversation);
        
        // Reset messages with welcome message
        const welcomeMessage = {
          type: 'system',
          content: 'Hello! I\'m your AI assistant. How can I help you with your data today?',
          timestamp: new Date().toISOString()
        };
        
        setMessages([welcomeMessage]);
        
        // Save welcome message to localStorage for the new conversation
        localStorage.setItem(`publicChat_messages_${id}_${newConversation.id}`, JSON.stringify([welcomeMessage]));
        
        // Add the new conversation to the list
        const newConversationItem = {
          id: newConversation.id,
          title: title,
          timestamp: new Date().toISOString(),
          messageCount: 1
        };
        
        setConversations(prevConversations => [newConversationItem, ...prevConversations]);
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };
  
  // Load conversations from localStorage
  const loadConversationsFromLocalStorage = () => {
    if (!id) return [];
    
    const allConversations = [];
    // Get all keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Check if the key matches our conversation pattern
      if (key && key.startsWith(`publicChat_messages_${id}_`)) {
        const conversationId = key.split(`publicChat_messages_${id}_`)[1];
        if (!conversationId) continue;
        
        try {
          const messages = JSON.parse(localStorage.getItem(key) || '[]');
          
          // Get the first user message as title, or use a default
          let title = 'Conversation';
          for (const msg of messages) {
            if (msg.type === 'user') {
              title = msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '');
              break;
            }
          }
          
          // Get the timestamp of the last message
          const lastMessage = messages[messages.length - 1];
          const timestamp = lastMessage ? lastMessage.timestamp : new Date().toISOString();
          
          allConversations.push({
            id: conversationId,
            title,
            timestamp,
            messageCount: messages.length
          });
        } catch (error) {
          console.error('Error parsing messages for conversation:', conversationId, error);
        }
      }
    }
    
    // Sort conversations by timestamp (newest first)
    allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setConversations(allConversations);
    return allConversations;
  };
  
  // Load conversation from localStorage on component mount
  useEffect(() => {
    if (router.isReady && id) {
      const storedConversationId = localStorage.getItem(`publicConversation_${id}`);
      const allConversations = loadConversationsFromLocalStorage();
      
      if (storedConversationId) {
        // Set the conversation from localStorage
        setCurrentConversation({ id: storedConversationId });
      } else if (allConversations && allConversations.length > 0) {
        // If there are conversations but no current one selected, use the most recent
        setCurrentConversation({ id: allConversations[0].id });
        localStorage.setItem(`publicConversation_${id}`, allConversations[0].id);
      } else {
        // Create a new conversation if none exists
        createNewConversation();
      }
    }
  }, [router.isReady, id]);
  
  // Select a conversation
  const selectConversation = (conversationId) => {
    setCurrentConversation({ id: conversationId });
    localStorage.setItem(`publicConversation_${id}`, conversationId);
    
    // Load messages for this conversation
    const storedMessages = localStorage.getItem(`publicChat_messages_${id}_${conversationId}`);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          console.log(`Loaded ${parsedMessages.length} messages for conversation ${conversationId}`);
          setMessages(parsedMessages);
        } else {
          console.warn(`No messages found in localStorage for conversation ${conversationId}`);
          // If no messages found, fetch them from the API
          fetchMessagesFromAPI(conversationId);
        }
      } catch (error) {
        console.error('Error parsing stored messages:', error);
        // If error parsing, fetch from API
        fetchMessagesFromAPI(conversationId);
      }
    } else {
      console.warn(`No messages in localStorage for conversation ${conversationId}`);
      // If no stored messages, fetch from API
      fetchMessagesFromAPI(conversationId);
    }
    
    setIsConversationListOpen(false);
  };
  
  // Add a function to fetch messages from the API
  const fetchMessagesFromAPI = async (conversationId) => {
    try {
      console.log(`Fetching messages for conversation ${conversationId} from API`);
      setIsLoading(true);
      
      // Make API request to get messages for this conversation
      const response = await axios.get(`${API_URL}/queries/public/messages/${id}/${conversationId}`);
      
      if (response.data.status === 'success' && response.data.messages) {
        // Convert API message format to our local format
        const formattedMessages = response.data.messages.map(msg => ({
          type: msg.is_user ? 'user' : 'system',
          content: msg.content,
          timestamp: msg.created_at || new Date().toISOString(),
          pdf_data: msg.pdf_data,
          pdf_filename: msg.pdf_filename
        }));
        
        console.log(`Received ${formattedMessages.length} messages from API`);
        
        // Update state with fetched messages
        setMessages(formattedMessages);
        
        // Save to localStorage for future use
        localStorage.setItem(`publicChat_messages_${id}_${conversationId}`, JSON.stringify(formattedMessages));
      } else {
        console.warn('API returned no messages or error');
        // If API fails, show a welcome message
        setMessages([{
          type: 'system',
          content: 'Hello! I\'m your AI assistant. How can I help you with your data today?',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error fetching messages from API:', error);
      // If API request fails, show a welcome message
      setMessages([{
        type: 'system',
        content: 'Hello! I\'m your AI assistant. How can I help you with your data today?',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process URL parameters
  useEffect(() => {
    if (router.isReady) {
      // Check for parameter triplets in URL
      const params = [];
      const keys = Object.keys(router.query);
      
      console.log('Processing URL parameters:', router.query);
      
      // Group parameters by their index
      const paramGroups = {};
      keys.forEach(key => {
        if (key.startsWith('param_')) {
          const parts = key.split('_');
          if (parts.length >= 3) { // Make sure we have param_type_index format
            const paramType = parts[1]; // table, column, or value
            const paramIndex = parts[2]; // Index should be the third part
            
            if (!paramGroups[paramIndex]) {
              paramGroups[paramIndex] = {};
            }
            
            paramGroups[paramIndex][paramType] = router.query[key];
          }
        }
      });
      
      console.log('Grouped parameters:', paramGroups);
      
      // Convert groups to parameter objects
      Object.values(paramGroups).forEach(group => {
        if (group.table && group.column) {
          params.push({
            table: group.table,
            column: group.column,
            value: group.value || null
          });
        }
      });
      
      console.log('Extracted parameters:', params);
      setParameters(params);
      
      // Store parameters in localStorage for persistence
      if (id) {
        localStorage.setItem(`publicChat_parameters_${id}`, JSON.stringify(params));
      }
    }
  }, [router.isReady, router.query, id]);
  
  // Load parameters from localStorage when component mounts
  useEffect(() => {
    if (router.isReady && id) {
      const storedParams = localStorage.getItem(`publicChat_parameters_${id}`);
      if (storedParams) {
        try {
          const parsedParams = JSON.parse(storedParams);
          if (Array.isArray(parsedParams)) {
            setParameters(parsedParams);
            console.log('Loaded parameters from localStorage:', parsedParams);
          }
        } catch (error) {
          console.error('Error parsing stored parameters:', error);
        }
      }
    }
  }, [router.isReady, id]);
  
  // Add this useEffect to log parameters whenever they change
  useEffect(() => {
    console.log('Parameters updated:', parameters);
    
    // Store updated parameters in localStorage
    if (id && parameters.length > 0) {
      localStorage.setItem(`publicChat_parameters_${id}`, JSON.stringify(parameters));
    }
  }, [parameters, id]);
  
  // Add welcome message when component mounts
  useEffect(() => {
    if (router.isReady) {
      setMessages([
        {
          type: 'system',
          content: 'Hello! I\'m your AI assistant. How can I help you with your data today?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [router.isReady]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Add futuristic typing sound effect when AI is responding
    if (isLoading) {
      const typingInterval = setInterval(() => {
        const typingSound = new Audio('/sounds/typing.mp3');
        typingSound.volume = 0.1;
        typingSound.play().catch(e => console.log('Audio play prevented:', e));
      }, 800);
      
      return () => clearInterval(typingInterval);
    }
  }, [messages, isLoading]);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (currentConversation && currentConversation.id) {
      localStorage.setItem(`publicChat_messages_${id}_${currentConversation.id}`, JSON.stringify(messages));
    }
  }, [messages, currentConversation, id]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    if (router.isReady && id && currentConversation && currentConversation.id) {
      const storedMessages = localStorage.getItem(`publicChat_messages_${id}_${currentConversation.id}`);
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            setMessages(parsedMessages);
            return; // Don't show welcome message if we have stored messages
          }
        } catch (error) {
          console.error('Error parsing stored messages:', error);
        }
      }
      
      // If no stored messages or error parsing, show welcome message
      setMessages([
        {
          type: 'system',
          content: 'Hello! I\'m your AI assistant. How can I help you with your data today?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [router.isReady, id, currentConversation]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Play send message sound
    const sendSound = new Audio('/sounds/message-sent.mp3');
    sendSound.volume = 0.2;
    sendSound.play().catch(e => console.log('Audio play prevented:', e));
    
    const userMessage = {
      type: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    // Update messages with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage('');
    setIsLoading(true);
    
    // Add a placeholder for the AI response with a typing indicator
    const typingMessage = {
      type: 'system',
      content: '●',
      isTyping: true,
      timestamp: new Date().toISOString()
    };
    
    const messagesWithTyping = [...updatedMessages, typingMessage];
    setMessages(messagesWithTyping);
    
    try {
      // If no conversation exists, create one first
      if (!currentConversation || !currentConversation.id) {
        await createNewConversation();
      }
      
      // Get parameters from state
      const currentParams = parameters || [];
      
      // Log the parameters for debugging
      console.log('Parameters from state:', currentParams);
      
      // Create the request payload
      const payload = {
        query: userMessage.content,
        conversation_id: currentConversation?.id
      };
      
      // EXPLICITLY add pairs to the payload if we have parameters
      if (currentParams && currentParams.length > 0) {
        payload.pairs = currentParams;
      }
      
      // Log the final payload
      console.log('Final API payload:', JSON.stringify(payload));
      
      // Make the API request
      const response = await axios.post(`${API_URL}/queries/public/execute/${id}`, payload);
      
      console.log('API response:', response.data);
      
      // Remove the typing message
      const messagesWithoutTyping = updatedMessages;
      
      if (response.data.status === 'success') {
        // Handle the new response format which includes messages array
        if (response.data.messages && Array.isArray(response.data.messages)) {
          // Find the AI response message (the last non-user message)
          const aiMessages = response.data.messages.filter(msg => !msg.is_user);
          const lastAiMessage = aiMessages[aiMessages.length - 1];
          
          if (lastAiMessage) {
            const systemMessage = {
              type: 'system',
              content: lastAiMessage.content,
              timestamp: lastAiMessage.created_at || new Date().toISOString(),
              queryResult: response.data,
              pdf_data: lastAiMessage.pdf_data,
              pdf_filename: lastAiMessage.pdf_filename
            };
            
            const finalMessages = [...messagesWithoutTyping, systemMessage];
            setMessages(finalMessages);
            
            // Save messages to localStorage
            if (currentConversation && currentConversation.id) {
              localStorage.setItem(`publicChat_messages_${id}_${currentConversation.id}`, JSON.stringify(finalMessages));
              
              // Update conversation list to reflect new message count and timestamp
              loadConversationsFromLocalStorage();
            }
          }
        } else {
          // Fallback to old format if messages array is not present
          const systemMessage = {
            type: 'system',
            content: response.data.message || 'Here are the results for your query.',
            timestamp: new Date().toISOString(),
            queryResult: response.data,
            pdf_data: response.data.pdf_data,
            pdf_filename: response.data.pdf_filename
          };
          
          const finalMessages = [...messagesWithoutTyping, systemMessage];
          setMessages(finalMessages);
          
          // Save messages to localStorage
          if (currentConversation && currentConversation.id) {
            localStorage.setItem(`publicChat_messages_${id}_${currentConversation.id}`, JSON.stringify(finalMessages));
            
            // Update conversation list to reflect new message count and timestamp
            loadConversationsFromLocalStorage();
          }
        }
      } else {
        // Handle error response
        const errorMessage = {
          type: 'system',
          content: response.data.message || 'Sorry, I could not process your query.',
          timestamp: new Date().toISOString(),
          isError: true
        };
        
        const finalMessages = [...messagesWithoutTyping, errorMessage];
        setMessages(finalMessages);
        
        // Save messages to localStorage
        if (currentConversation && currentConversation.id) {
          localStorage.setItem(`publicChat_messages_${id}_${currentConversation.id}`, JSON.stringify(finalMessages));
          
          // Update conversation list
          loadConversationsFromLocalStorage();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Remove the typing message and add error message
      const errorMessage = {
        type: 'system',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
      // Save messages to localStorage
      if (currentConversation && currentConversation.id) {
        localStorage.setItem(`publicChat_messages_${id}_${currentConversation.id}`, JSON.stringify(finalMessages));
        
        // Update conversation list
        loadConversationsFromLocalStorage();
      }
    } finally {
      setIsLoading(false);
      // Focus the input field after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Chat header - futuristic design with glow effect */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 border-b border-blue-700 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsConversationListOpen(!isConversationListOpen)}
              className="mr-3 text-white hover:bg-blue-800 rounded-full p-1 transition-colors"
              title="View conversations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white flex items-center">
              <div className="mr-3 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-glow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
              AI Data Assistant
              <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded-full text-blue-100">v2.0</span>
            </h1>
          </div>
          
          <button 
            onClick={createNewConversation}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md flex items-center transition-colors shadow-glow-blue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
      </div>
      
      {/* Conversation list dropdown */}
      {isConversationListOpen && (
        <div className="absolute top-16 left-4 z-50 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300">Your Conversations</h3>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No conversations found</div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3 hover:bg-gray-700 border-b border-gray-700 transition-colors ${
                    currentConversation?.id === conv.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-200 truncate">{conv.title}</div>
                  <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>{new Date(conv.timestamp).toLocaleString()}</span>
                    <span>{conv.messageCount} messages</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Chat messages - sci-fi inspired design */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 to-gray-800">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 backdrop-blur-sm ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-glow-blue'
                  : 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 text-gray-100 shadow-glow-dark'
              }`}
            >
              {message.isTyping ? (
                <div className="flex space-x-1 justify-center py-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              ) : message.queryResult ? (
                <div>
                  <div dangerouslySetInnerHTML={{ __html: applyMarkdown(message.content) }} />
                  {message.queryResult.result && message.queryResult.result.length > 0 && (
                    <div className="mt-4 bg-gray-800 p-3 rounded-md overflow-x-auto border border-gray-700 shadow-inner">
                      <div className="text-xs text-blue-400 mb-2 font-mono">DATA RESULTS</div>
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900">
                          <tr>
                            {Object.keys(message.queryResult.result[0]).map((key) => (
                              <th
                                key={key}
                                className="px-3 py-2 text-left text-xs font-medium text-blue-300 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {message.queryResult.result.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                              {Object.values(row).map((value, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-300"
                                >
                                  {value !== null && value !== undefined ? value.toString() : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {message.queryResult.sql_query && (
                    <div className="mt-4">
                      <details className="bg-gray-800 rounded-md border border-gray-700">
                        <summary className="cursor-pointer p-2 text-sm font-medium text-blue-400 hover:bg-gray-700 transition-colors flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          SQL Query
                        </summary>
                        <pre className="p-3 text-xs overflow-x-auto bg-gray-900 rounded-b-md text-green-400 font-mono border-t border-gray-700">
                          {message.queryResult.sql_query}
                        </pre>
                      </details>
                    </div>
                  )}
                  
                  {/* PDF Download Section */}
                  {message.pdf_data && message.pdf_filename && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-300 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {message.pdf_filename}
                        </span>
                        <button
                          onClick={() => handlePdfDownload(message.pdf_data, message.pdf_filename)}
                          className="flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: applyMarkdown(message.content) }} />
              )}
              
              {/* Add PDF download section for non-query messages */}
              {message.type === 'system' && !message.queryResult && message.pdf_data && message.pdf_filename && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-300 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {message.pdf_filename}
                    </span>
                    <button
                      onClick={() => handlePdfDownload(message.pdf_data, message.pdf_filename)}
                      className="flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input - futuristic design with glow effects */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-blue-500 rounded-lg opacity-10 blur-sm"></div>
            <input
              type="text"
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask me anything about your data..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all relative z-10"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-5 py-3 font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-glow-blue flex items-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <span>Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicAIAssistant;
