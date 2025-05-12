// pages/_app.js
import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }) {
  // Remove the server-side injected CSS on first client render
  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NLP SQL Bot</title>
      </Head>
      <Component {...pageProps} />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default MyApp;
