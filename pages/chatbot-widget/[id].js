import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
const API_URL = "http://127.0.0.1:5000/nlpsql";

// This page is publicly accessible - no authentication required
const ChatbotWidgetPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionName, setConnectionName] = useState('');

  useEffect(() => {
    // Wait for the id to be available from the router
    if (!id) return;
    
    // Validate the connection ID exists (optional)
    const validateConnection = async () => {
      try {
        // Use a special public endpoint to validate the connection without auth
        const response = await axios.get(`${API_URL}/connections/public/${id}/validate`);
        if (response.data.status === 'success') {
          setConnectionName(response.data.connection.name || 'Database');
        } else {
          setError('Invalid connection ID');
        }
      } catch (err) {
        console.log('Connection validation skipped or failed');
        // Continue anyway - we'll let the iframe handle errors
      } finally {
        setLoading(false);
      }
    };
    
    validateConnection();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
        <p className="text-gray-600">The requested chatbot could not be loaded.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{connectionName ? `${connectionName} - ` : ''}AI Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="h-screen w-screen flex flex-col">
        <iframe 
          src={`/connections/${id}/ai-assistant?public=true&embedded=true`}
          className="w-full h-full border-none"
          title="AI Assistant"
        />
      </div>
    </>
  );
};

// Export the component without any authentication wrapper
export default ChatbotWidgetPage;