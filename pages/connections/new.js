// pages/connections/new.js
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import ConnectionManager from '../../src/components/ConnectionManager/ConnectionManager';
import { withAuth } from '../../lib/auth';

const NewConnectionPage = () => {
  const router = useRouter();
  
  const handleSuccess = () => {
    // Navigate back to connections list after successful creation
    router.push('/connections');
  };
  
  return (
    <Layout>
      <Head>
        <title>Add Database Connection - NLP SQL Bot</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Add Database Connection</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <ConnectionManager onClose={handleSuccess} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(NewConnectionPage);