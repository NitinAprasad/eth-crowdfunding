import React from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { connectWithWallet } from '../helper/helper';
import { loadAccount } from '../redux/interactions';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const web3 = useSelector((state) => state.web3Reducer.connection);

  const connect = () => {
    const onSuccess = () => {
      loadAccount(web3, dispatch);
      router.push('/dashboard');
    };
    connectWithWallet(onSuccess);
  };

  useEffect(() => {
    (async () => {
      if (web3) {
        const account = await loadAccount(web3, dispatch);
        if (account.length > 0) router.push('/dashboard');
      }
    })();
  }, [web3]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Glass card */}
      <div
        className="fade-up"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 32,
          padding: '3.5rem 3rem',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        {/* Logo mark */}
        <div className="fade-up fade-up-delay-1" style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          borderRadius: 22,
          margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          boxShadow: '0 0 32px rgba(124,58,237,0.55)',
        }}>⬡</div>

        <h1 className="fade-up fade-up-delay-1" style={{
          fontSize: '1.9rem', fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>
          CrowdFund
        </h1>

        <p className="fade-up fade-up-delay-2" style={{
          color: 'rgba(200,215,255,0.6)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '2.5rem',
        }}>
          Decentralised crowdfunding, powered by Ethereum.
          <br />Connect your wallet to get started.
        </p>

        <button
          className="connect-btn fade-up fade-up-delay-3"
          onClick={connect}
          style={{ width: '100%' }}
        >
          🦊 Connect MetaMask
        </button>

        <p className="fade-up fade-up-delay-3" style={{
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: 'rgba(180,195,240,0.4)',
          lineHeight: 1.6,
        }}>
          Non-custodial · Your keys, your funds
        </p>
      </div>
    </div>
  );
}
