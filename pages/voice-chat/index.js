import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ChatInterface from '../../components/voice-chat/ChatInterface';
import { withAuth } from '../../lib/auth';

const VoiceChatPage = () => {
  return (
    <Layout>
      <Head>
        <title>Voice Chat - NLP SQL Bot</title>
      </Head>
      
      <div className="h-[calc(100vh-64px)]"> {/* Adjust height based on your header height */}
        <ChatInterface />
      </div>
    </Layout>
  );
};

export default withAuth(VoiceChatPage);
