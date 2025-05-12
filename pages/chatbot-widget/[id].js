import { useRouter } from 'next/router';
import PublicAIAssistant from '../../components/chatbot/PublicAIAssistant';

export default function ChatbotWidget({ id, queryParams }) {
  const router = useRouter();
  
  return (
    <div className="h-screen w-full">
      <PublicAIAssistant />
    </div>
  );
}

// Use getServerSideProps instead of getStaticProps/getStaticPaths
export async function getServerSideProps(context) {
  // Get the id from the path parameter
  const { id } = context.params;
  
  // Get all query parameters
  const queryParams = context.query;
  
  return {
    props: {
      id,
      queryParams
    }
  };
}
