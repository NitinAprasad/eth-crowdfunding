import { useEffect } from 'react';
import '../styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { wrapper } from '../redux/store';
import { useDispatch } from 'react-redux';
import {
  getAllFunding,
  loadAccount,
  loadCrowdFundingContract,
  loadWeb3,
  subscribeCrowdFundingEvents,
} from '../redux/interactions';
import { Router } from 'next/router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { chainOrAccountChangedHandler } from '../helper/helper';

function MyApp({ Component, pageProps }) {
  const dispatch = useDispatch();

  useEffect(() => {
    loadBlockchain();
  }, []);

  const loadBlockchain = async () => {
    const web3 = await loadWeb3(dispatch);
    const account = await loadAccount(web3, dispatch);
    const crowdFundingContract = await loadCrowdFundingContract(web3, dispatch);
    await getAllFunding(crowdFundingContract, web3, dispatch);
    subscribeCrowdFundingEvents(crowdFundingContract, dispatch);
  };

  Router.events.on('routeChangeStart', () => NProgress.start());
  Router.events.on('routeChangeComplete', () => NProgress.done());
  Router.events.on('routeChangeError', () => NProgress.done());

  useEffect(() => {
    // Guard: only attach listeners if MetaMask / ethereum provider is available
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', chainOrAccountChangedHandler);
      window.ethereum.on('chainChanged', chainOrAccountChangedHandler);

      // Cleanup listeners when the component unmounts
      return () => {
        window.ethereum.removeListener('accountsChanged', chainOrAccountChangedHandler);
        window.ethereum.removeListener('chainChanged', chainOrAccountChangedHandler);
      };
    }
  }, []);

  return (
    <>
      <ToastContainer />
      <Component {...pageProps} />
    </>
  );
}

export default wrapper.withRedux(MyApp);
