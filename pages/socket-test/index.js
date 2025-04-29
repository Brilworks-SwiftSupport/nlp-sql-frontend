import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import WebSocketTest from '../../components/socket-test/WebSocketTest';
import { withAuth } from '../../lib/auth';

const SocketTestPage = () => {
  return (
    <Layout>
      <Head>
        <title>Socket Test - NLP SQL Bot</title>
      </Head>
      
      <div className="h-[calc(100vh-64px)]">
        <WebSocketTest />
      </div>
    </Layout>
  );
};

export default withAuth(SocketTestPage);