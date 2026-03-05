import React, { useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { contribute, createWithdrawRequest } from '../redux/interactions';
import { etherToWei } from '../helper/helper';
import { toastSuccess, toastError } from '../helper/toastMessage';

const STATE_COLORS = {
  Fundraising: { bg: 'rgba(96,165,250,0.18)', border: 'rgba(96,165,250,0.5)', text: '#93c5fd' },
  Expired: { bg: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.5)', text: '#fca5a5' },
  Successful: { bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.5)', text: '#6ee7b7' },
};

const FundRiserCard = ({ props, pushWithdrawRequests }) => {
  const [btnLoader, setBtnLoader] = useState(false);
  const [amount, setAmount] = useState('');
  const dispatch = useDispatch();
  const crowdFundingContract = useSelector((s) => s.fundingReducer.contract);
  const account = useSelector((s) => s.web3Reducer.account);
  const web3 = useSelector((s) => s.web3Reducer.connection);

  const stateStyle = STATE_COLORS[props.state] || STATE_COLORS.Fundraising;

  const contributeAmount = (projectId, minContribution) => {
    if (!amount || Number(amount) < Number(minContribution)) {
      toastError(`Minimum contribution is ${minContribution} ETH`);
      return;
    }
    setBtnLoader(projectId);
    const data = {
      contractAddress: projectId,
      amount: etherToWei(String(amount)),
      account,
    };
    contribute(crowdFundingContract, data, dispatch,
      () => { setBtnLoader(false); setAmount(''); toastSuccess(`Contributed ${amount} ETH ✓`); },
      (msg) => { setBtnLoader(false); toastError(msg); }
    );
  };

  const requestForWithdraw = (projectId) => {
    if (!amount || Number(amount) <= 0) { toastError('Enter an amount'); return; }
    setBtnLoader(projectId);
    const data = {
      description: `${amount} ETH withdrawal request`,
      amount: etherToWei(String(amount)),
      recipient: account, account,
    };
    createWithdrawRequest(web3, projectId, data,
      (d) => {
        setBtnLoader(false); setAmount('');
        if (pushWithdrawRequests) pushWithdrawRequests(d);
        toastSuccess(`Withdrawal request created for ${amount} ETH`);
      },
      (msg) => { setBtnLoader(false); toastError(msg); }
    );
  };

  const isLoading = btnLoader === props.address;

  return (
    <div className="card fade-up" style={{ marginBottom: '1.5rem', position: 'relative' }}>

      {/* Status ribbon */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem',
        background: stateStyle.bg,
        border: `1px solid ${stateStyle.border}`,
        borderRadius: 999,
        padding: '0.2rem 0.75rem',
        fontSize: '0.68rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: stateStyle.text,
      }}>
        {props.state}
      </div>

      {/* Title */}
      <Link href={`/project-details/${props.address}`}>
        <h2 style={{
          fontSize: '1.1rem', fontWeight: 700,
          background: 'linear-gradient(90deg, #e2e8f0, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          cursor: 'pointer', marginBottom: '0.4rem', paddingRight: '5rem',
          lineHeight: 1.3,
        }}>
          {props.title}
        </h2>
      </Link>

      <p style={{
        color: 'rgba(200,215,255,0.55)',
        fontSize: '0.85rem', lineHeight: 1.55,
        marginBottom: '1.2rem',
      }}>
        {props.description}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {[
          { label: 'Goal', value: `${props.goalAmount} ETH` },
          { label: 'Raised', value: `${props.currentAmount} ETH` },
          { label: 'Deadline', value: props.deadline },
          { label: 'Min. Contrib', value: `${props.minContribution} ETH` },
        ].map(({ label, value }) => (
          <div key={label} className="inner-card" style={{ flex: '1 1 120px' }}>
            <span className="glass-label">{label}</span>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {props.state !== 'Successful' && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="glass-label">Progress</span>
            <span style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 700 }}>
              {props.progress || 0}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress" style={{ width: `${Math.min(props.progress || 0, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Action area */}
      {props.state === 'Successful' ? (
        <>
          {/* Contract balance */}
          <div className="inner-card" style={{ marginBottom: '1rem' }}>
            <span className="glass-label">Contract Balance</span>
            <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '1rem' }}>
              {props.contractBalance} ETH
            </div>
          </div>

          {/* Withdraw (creator only) */}
          {props.creator === account && (
            <div>
              <label className="glass-label">Withdraw amount (ETH)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="input"
                  min="0" step="0.01"
                />
                <button
                  className="button"
                  onClick={() => requestForWithdraw(props.address)}
                  disabled={isLoading}
                  style={{ whiteSpace: 'nowrap', minWidth: 100 }}
                >
                  {isLoading ? '⏳ Wait…' : 'Request'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Contribute
        <div>
          <label className="glass-label">Contribution amount (ETH)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              className="input"
              min="0" step="0.01"
            />
            <button
              className="button"
              onClick={() => contributeAmount(props.address, props.minContribution)}
              disabled={isLoading}
              style={{ whiteSpace: 'nowrap', minWidth: 110 }}
            >
              {isLoading ? '⏳ Wait…' : '⚡ Contribute'}
            </button>
          </div>
          <p style={{
            fontSize: '0.72rem', color: 'rgba(200,215,255,0.45)',
            marginTop: 6, lineHeight: 1.5,
          }}>
            Minimum: <strong style={{ color: '#a78bfa' }}>{props.minContribution} ETH</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default FundRiserCard;