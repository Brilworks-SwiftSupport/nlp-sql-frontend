
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = "http://127.0.0.1:5000/nlpsql";

const PublicAIAssistant = () => {
  const router = useRouter();
  const { id } = router.query;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Add a welcome message when the component mounts with typing effect
  useEffect(() => {
    if (id) {
      setIsTyping(true);
      const welcomeMessage = {
        type: 'system',
        content: '',
        fullContent: 'Hello! I\'m your AI assistant. How can I help you with your data today?',
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      
      // Simulate typing effect
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < welcomeMessage.fullContent.length) {
          setMessages(prev => [{
            ...prev[0],
            content: welcomeMessage.fullContent.substring(0, i + 1)
          }]);
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
          setMessages(prev => [{
            ...prev[0],
            content: welcomeMessage.fullContent
          }]);
        }
      }, 30);
      
      return () => clearInterval(typingInterval);
    }
  }, [id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);
  
  // Function to handle PDF download
  const handlePdfDownload = (base64Data, filename) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      // Add error message to chat
      const errorMessage = {
        type: 'system',
        content: 'Failed to download PDF. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading) return;
    
    const userMessage = {
      type: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    
    // Add a placeholder for the AI response with a typing indicator
    const placeholderIndex = messages.length + 1;
    setMessages(prev => [...prev, {
      type: 'system',
      content: '●',
      isTyping: true,
      timestamp: new Date().toISOString()
    }]);
    
    try {
      // Use the public API endpoint
      const response = await axios.post(`${API_URL}/queries/public/execute/${id}`, {
        query: userMessage.content
      });
      
      // Remove the placeholder message
      setMessages(prev => prev.filter((_, index) => index !== placeholderIndex));
      
      if (response.data.status === 'success') {
        const systemMessage = {
          type: 'system',
          content: response.data.message || 'Here are the results for your query.',
          timestamp: new Date().toISOString(),
          queryResult: response.data,
          pdf_data: response.data.pdf_data,
          pdf_filename: response.data.pdf_filename
        };
        
        setMessages(prev => [...prev, systemMessage]);
      } else {
        // Handle error response
        const errorMessage = {
          type: 'system',
          content: response.data.message || 'Sorry, I could not process your query.',
          timestamp: new Date().toISOString(),
          isError: true
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the placeholder message
      setMessages(prev => prev.filter((_, index) => index !== placeholderIndex));
      
      // Add error message
      const errorMessage = {
        type: 'system',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus the input field after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">FinTech Assistant</h1>
            <p className="text-xs text-blue-200">Powered by advanced financial analytics</p>
          </div>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            {message.type === 'system' && !message.isTyping && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mr-2 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <div 
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 rounded-tr-none' 
                  : message.isTyping
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 animate-pulse'
                    : message.isError 
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 rounded-tl-none' 
                      : 'bg-gradient-to-r from-slate-800 to-blue-900 rounded-tl-none'
              }`}
            >
              {message.isTyping ? (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : (
                <>
                  <div className="text-sm">{message.content}</div>
                  
                  {message.queryResult && message.queryResult.result && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-sm font-medium text-blue-300 mb-2">Results:</div>
                      <div className="overflow-x-auto rounded-lg bg-slate-900 bg-opacity-40 p-2">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead>
                            <tr>
                              {Object.keys(message.queryResult.result[0] || {}).map((key) => (
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
                            {message.queryResult.result.slice(0, 5).map((row, i) => (
                              <tr key={i} className="hover:bg-gray-700 transition-colors">
                                {Object.values(row).map((value, j) => (
                                  <td key={j} className="px-3 py-2 text-xs text-gray-300">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {message.queryResult.result.length > 5 && (
                          <div className="text-xs text-gray-400 mt-2 text-center">
                            Showing 5 of {message.queryResult.result.length} results
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* PDF Download Section */}
                  {message.pdf_data && message.pdf_filename && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between bg-slate-900 bg-opacity-40 p-2 rounded-lg">
                        <span className="text-sm font-medium text-blue-300 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {message.pdf_filename}
                        </span>
                        <button
                          onClick={() => handlePdfDownload(message.pdf_data, message.pdf_filename)}
                          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-2 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ml-2 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="p-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm border-t border-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask me anything about your financial data..."
              className="w-full bg-slate-800 text-white border border-gray-700 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              disabled={isLoading || isTyping}
            />
            {!isLoading && !isTyping && newMessage.trim() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" />
                </svg>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className={`h-12 w-12 rounded-full flex items-center justify-center focus:outline-none ${
              isLoading || isTyping || !newMessage.trim()
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg'
            }`}
            disabled={isLoading || isTyping || !newMessage.trim()}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" />
              </svg>
            )}
          </button>
        </form>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            Powered by advanced AI • Ask complex questions about your financial data
          </p>
        </div>
      </div>
    </div>
  );
};

// Add these animations to your globals.css
const addGlobalStyles = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
};

// Call the function to add global styles
if (typeof window !== 'undefined') {
  addGlobalStyles();
}

export default PublicAIAssistant;
