import { useState, useEffect, useRef } from 'react';
import axios from '../../lib/api';
import { connectionAPI } from '../../lib/api';
import VoiceMode from './VoiceMode';

const ChatInterface = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [connections, setConnections] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [pairs, setPairs] = useState([{ table: '', column: '', value: '' }]);
  const [schema, setSchema] = useState({});
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  const startNewConversation = async () => {
    try {
      // Create a title with current date and time
      const now = new Date();
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString();
      const title = `Chat_${formattedDate}_${formattedTime}`;
      
      const response = await axios.post('/conversations', {
        title: title,
        connection_id: selectedConnectionId
      });
      
      if (response.data.status === 'success') {
        const newConversation = response.data.conversation;
        setCurrentConversation(newConversation);
        setMessages([]);
        setNewMessage('');
        
        // Update the conversations list
        await fetchConversations();
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/conversations');
      if (response.data.status === 'success') {
        setConversations(response.data.conversations);
        
        // Automatically select the first conversation if available and none is currently selected
        if (response.data.conversations.length > 0 && !currentConversation) {
          const firstConversation = response.data.conversations[0];
          setCurrentConversation(firstConversation);
          
          // Fetch messages for the selected conversation
          await fetchMessages(firstConversation.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch messages for a conversation and update selected connection
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`/conversations/${conversationId}/messages`);
      if (response.data.status === 'success') {
        setMessages(response.data.messages);
        
        // Find the current conversation to get its connection_id
        if (currentConversation && currentConversation.connection_id) {
          // Update the selected connection ID
          setSelectedConnectionId(currentConversation.connection_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      if (!currentConversation) {
        // Create new conversation
        const conversationResponse = await axios.post('/conversations', {
          title: newMessage,
          connection_id: selectedConnectionId,
          pairs: pairs.filter(pair => pair.table && pair.column && pair.value)
        });
        
        if (conversationResponse.data.status === 'success') {
          const newConversationId = conversationResponse.data.conversation.id;
          setCurrentConversation(conversationResponse.data.conversation);
          
          // Send message in new conversation
          const messageResponse = await axios.post(`/conversations/${newConversationId}/messages`, {
            content: newMessage,
            connection_id: selectedConnectionId,
            pairs: pairs.filter(pair => pair.table && pair.column && pair.value)
          });
          
          if (messageResponse.data.status === 'success') {
            setMessages(messageResponse.data.messages);
            await fetchConversations(); // Refresh conversation list
          }
        }
      } else {
        // Send message in existing conversation
        const response = await axios.post(`/conversations/${currentConversation.id}/messages`, {
          content: newMessage,
          connection_id: selectedConnectionId,
          pairs: pairs.filter(pair => pair.table && pair.column && pair.value)
        });
        
        if (response.data.status === 'success') {
          // Append the new messages to existing messages
          setMessages(prevMessages => [...prevMessages, ...response.data.messages]);
        }
      }
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = async (text) => {
    await handleSendMessage({ preventDefault: () => {} }, text);
  };

  // Fetch connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await connectionAPI.getConnections();
        if (response.status === 'success') {
          setConnections(response.connections);
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      }
    };
    fetchConnections();
  }, []);

  // Fetch schema when connection changes
  useEffect(() => {
    const fetchSchema = async () => {
      if (!selectedConnectionId) return;
      try {
        const response = await connectionAPI.getConnection(selectedConnectionId);
        if (response.status === 'success' && response.connection.schema) {
          setSchema(response.connection.schema);
        }
      } catch (error) {
        console.error('Failed to fetch schema:', error);
      }
    };
    fetchSchema();
  }, [selectedConnectionId]);

  // Handle pair changes
  const handlePairChange = (index, field, value) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setPairs(newPairs);
  };

  const addPair = () => {
    setPairs([...pairs, { table: '', column: '', value: '' }]);
  };

  const removePair = (index) => {
    setPairs(pairs.filter((_, i) => i !== index));
  };
  const currentConversationRef = useRef(null);
useEffect(() => {
  currentConversationRef.current = currentConversation;
}, [currentConversation]);

  // Function to refresh messages - will be passed to VoiceMode
  const refreshMessages = async () => {
    if (currentConversationRef) {
      await fetchMessages(currentConversationRef.current.id);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex"> {/* Subtract navbar height */}
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-[margin] duration-300 ${
        isSidebarOpen ? 'mr-80' : ''
      }`}>
        {/* Chat Header */}
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">
            {currentConversation ? currentConversation.title : 'New Conversation'}
          </h1>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Settings Panel */}
        <div className={`mt-4 transition-all duration-300 ${isSettingsOpen ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
          {/* Connection Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Connection</label>
            <select
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a connection</option>
              {connections.map(conn => (
                <option key={conn.id} value={conn.id}>
                  {conn.id} - {conn.name}
                </option>
              ))}
            </select>
          </div>

          {/* Query Parameters */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Query Parameters</label>
            {pairs.map((pair, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={pair.table}
                  onChange={(e) => handlePairChange(index, 'table', e.target.value)}
                  className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Table</option>
                  {Object.keys(schema).map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
                <select
                  value={pair.column}
                  onChange={(e) => handlePairChange(index, 'column', e.target.value)}
                  className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Column</option>
                  {schema[pair.table]?.columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={pair.value}
                  onChange={(e) => handlePairChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={() => removePair(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={addPair}
              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Parameter
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && !currentConversation && (
              <div className="text-center mt-10">
                <h2 className="text-xl font-semibold text-gray-700">Welcome to the Chat Interface</h2>
                <p className="text-gray-500 mt-2">Start a conversation by typing a message below</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.is_user ? 'ml-auto' : 'mr-auto'}`}
              >
                <div
                  className={`max-w-lg p-4 rounded-lg ${
                    message.is_user
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setIsVoiceModeOpen(true)}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Sidebar */}
      <div
        className={`w-80 bg-white border-l flex-shrink-0 transition-[width] duration-300 overflow-hidden ${
          isSidebarOpen ? 'w-80' : 'w-0'
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        
        {/* New Conversation Button */}
        <div className="p-4 border-b">
          <button
            onClick={startNewConversation}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto h-[calc(100%-8rem)]">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setCurrentConversation(conversation);
                fetchMessages(conversation.id);
                // Set the selected connection ID based on the conversation
                if (conversation.connection_id) {
                  setSelectedConnectionId(conversation.connection_id);
                }
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`w-full text-left p-4 hover:bg-gray-50 border-b ${
                currentConversation?.id === conversation.id ? 'bg-gray-100' : ''
              }`}
            >
              <p className="font-medium truncate">{conversation.title}</p>
            </button>
          ))}
        </div>
      </div>
      <VoiceMode
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onMessageSent={handleVoiceMessage}
        conversationId={currentConversation?.id}
        selectedConnectionId={selectedConnectionId}
        pairs={pairs}
        refreshMessages={refreshMessages}
      />
    </div>
  );
};

export default ChatInterface;
