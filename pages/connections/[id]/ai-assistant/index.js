// pages/connections/[id]/ai-assistant/index.js
import { useRouter } from 'next/router';
import Head from 'next/head';

import PublicChatInterface from '../../../../components/chatbot/PublicAIAssistant';

const AiAssistantPage = () => {
  const router = useRouter();
  
  return (
      <div className="h-screen w-full">
        <Head>
          <title>AI Assistant</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <PublicChatInterface />
      </div>
    );
  
  
  
};

// Export the component directly without wrapping it with withAuth
// We'll handle auth checks inside the component based on the public parameter
export default AiAssistantPage;
