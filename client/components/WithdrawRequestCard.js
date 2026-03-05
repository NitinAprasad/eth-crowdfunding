import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toastError, toastSuccess } from '../helper/toastMessage';
import { voteWithdrawRequest, withdrawAmount } from '../redux/interactions';

const STATUS_STYLE = {
  Pending: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', text: '#93c5fd' },
  Completed: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', text: '#6ee7b7' },
};

const WithdrawRequestCard = ({ props, withdrawReq, setWithdrawReq, contractAddress }) => {
  const dispatch = useDispatch();
  const [btnLoader, setBtnLoader] = useState(false);
  const account = useSelector((s) => s.web3Reducer.account);
  const web3 = useSelector((s) => s.web3Reducer.connection);

  const statusStyle = STATUS_STYLE[props.status] || STATUS_STYLE.Pending;
  const isLoading = btnLoader === props.requestId;
  const isCreator = account === (props.recipient ?? props.reciptant);

  const withdrawBalance = (reqId) => {
    setBtnLoader(reqId);
    const data = { contractAddress, reqId, account, amount: props.amount };
    withdrawAmount(web3, dispatch, data,
      () => {
        setBtnLoader(false);
        const updated = withdrawReq.map((r) =>
          r.requestId === props.requestId ? { ...r, status: 'Completed' } : r
        );
        setWithdrawReq(updated);
        toastSuccess(`Withdrawal completed for request #${reqId}`);
      },
      (msg) => { setBtnLoader(false); toastError(msg); }
    );
  };

  const vote = (reqId) => {
    setBtnLoader(reqId);
    const data = { contractAddress, reqId, account };
    voteWithdrawRequest(web3, data,
      () => {
        setBtnLoader(false);
        const updated = withdrawReq.map((r) =>
          r.requestId === props.requestId
            ? { ...r, totalVote: Number(r.totalVote) + 1 }
            : r
        );
        setWithdrawReq(updated);
        toastSuccess(`Vote cast for request #${reqId}`);
      },
      (msg) => { setBtnLoader(false); toastError(msg); }
    );
  };

  return (
    <div className="card fade-up" style={{ marginBottom: '1rem', position: 'relative' }}>
      {/* Status badge */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem',
        background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
        borderRadius: 999, padding: '0.18rem 0.7rem',
        fontSize: '0.68rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: statusStyle.text,
      }}>
        {props.status}
      </div>

      <h3 style={{
        fontSize: '1rem', fontWeight: 600,
        color: '#e2e8f0',
        marginBottom: '1rem',
        paddingRight: '6rem',
        lineHeight: 1.4,
      }}>
        {props.desc}
      </h3>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="inner-card" style={{ flex: '1 1 100px' }}>
          <span className="glass-label">Requested</span>
          <div style={{ color: '#a78bfa', fontWeight: 700 }}>{props.amount} ETH</div>
        </div>
        <div className="inner-card" style={{ flex: '1 1 100px' }}>
          <span className="glass-label">Votes</span>
          <div style={{ color: '#60a5fa', fontWeight: 700 }}>{props.totalVote}</div>
        </div>
        <div className="inner-card" style={{ flex: '2 1 180px' }}>
          <span className="glass-label">Recipient</span>
          <div style={{
            color: '#e2e8f0', fontWeight: 500, fontSize: '0.78rem',
            fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {(props.recipient ?? props.reciptant ?? '—').slice(0, 20)}…
          </div>
        </div>
      </div>

      {/* Action */}
      {isCreator ? (
        <button
          className="withdraw-button"
          onClick={() => withdrawBalance(props.requestId)}
          disabled={props.status === 'Completed' || isLoading}
        >
          {isLoading ? '⏳ Processing…' : props.status === 'Completed' ? '✓ Withdrawn' : '💸 Withdraw'}
        </button>
      ) : (
        <button
          className="withdraw-button"
          onClick={() => vote(props.requestId)}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Voting…' : '🗳️ Vote to Approve'}
        </button>
      )}
    </div>
  );
};

export default WithdrawRequestCard;