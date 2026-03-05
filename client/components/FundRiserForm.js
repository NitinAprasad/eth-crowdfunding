import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { startFundRaising } from '../redux/interactions';
import { useDispatch, useSelector } from 'react-redux';
import { etherToWei } from '../helper/helper';
import { toastSuccess, toastError } from '../helper/toastMessage';

// Load DrumDatePicker client-side only (uses window)
const DrumDatePicker = dynamic(() => import('./DrumDatePicker'), { ssr: false });

const FundRiserForm = () => {
    const crowdFundingContract = useSelector((s) => s.fundingReducer.contract);
    const account = useSelector((s) => s.web3Reducer.account);
    const web3 = useSelector((s) => s.web3Reducer.connection);
    const dispatch = useDispatch();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetedAmount, setTargetedAmount] = useState('');
    const [minimumAmount, setMinimumAmount] = useState('');
    const [deadlineIso, setDeadlineIso] = useState(''); // ISO YYYY-MM-DD from drum picker
    const [btnLoading, setBtnLoading] = useState(false);

    const riseFund = (e) => {
        e.preventDefault();
        if (!deadlineIso) { toastError('Please select a deadline'); return; }

        setBtnLoading(true);
        // Convert ISO date to Unix timestamp (milliseconds → divide by 1000 for Solidity)
        const unixMs = new Date(deadlineIso).getTime();

        if (unixMs <= Date.now()) {
            toastError('Deadline must be in the future');
            setBtnLoading(false);
            return;
        }

        const data = {
            minimumContribution: etherToWei(String(minimumAmount)),
            deadline: Math.floor(unixMs / 1000), // seconds
            targetContribution: etherToWei(String(targetedAmount)),
            projectTitle: title,
            projectDesc: description,
            account,
        };

        startFundRaising(web3, crowdFundingContract, data,
            () => {
                setBtnLoading(false);
                setTitle(''); setDescription('');
                setTargetedAmount(''); setMinimumAmount('');
                setDeadlineIso('');
                toastSuccess('Fund raising started 🎉');
            },
            (err) => { setBtnLoading(false); toastError(err); },
            dispatch
        );
    };

    const fields = [
        { label: 'Project Title', id: 'title', type: 'text', placeholder: 'e.g. Open Source AI Tool', value: title, set: setTitle },
        { label: 'Description', id: 'desc', type: 'textarea', placeholder: 'Describe your project…', value: description, set: setDescription },
        { label: 'Target Amount (ETH)', id: 'target', type: 'number', placeholder: '10.0', value: targetedAmount, set: setTargetedAmount },
        { label: 'Minimum Contribution (ETH)', id: 'min', type: 'number', placeholder: '0.1', value: minimumAmount, set: setMinimumAmount },
    ];

    return (
        <div className="card fade-up">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                    fontSize: '1.15rem', fontWeight: 700,
                    background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.25rem',
                }}>
                    Start a Fund Raiser
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'rgba(200,215,255,0.45)' }}>
                    Launch your project on-chain, for free.
                </p>
            </div>

            <form onSubmit={riseFund}>
                {fields.map(({ label, id, type, placeholder, value, set }) => (
                    <div key={id} style={{ marginBottom: '1rem' }}>
                        <label className="glass-label" htmlFor={id}>{label}</label>
                        {type === 'textarea' ? (
                            <textarea
                                id={id}
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) => set(e.target.value)}
                                required
                                rows={3}
                                className="form-control-input"
                                style={{ resize: 'none' }}
                            />
                        ) : (
                            <input
                                id={id}
                                type={type}
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) => set(e.target.value)}
                                required
                                className="form-control-input"
                                min={type === 'number' ? '0' : undefined}
                                step={type === 'number' ? '0.001' : undefined}
                            />
                        )}
                    </div>
                ))}

                {/* Drum Date Picker */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label className="glass-label">
                        Deadline
                        {deadlineIso && (
                            <span style={{ marginLeft: 8, color: '#a78bfa', textTransform: 'none', letterSpacing: 0 }}>
                                — {new Date(deadlineIso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </label>
                    <DrumDatePicker value={deadlineIso} onChange={setDeadlineIso} />
                </div>

                <button
                    type="submit"
                    className="button"
                    disabled={btnLoading}
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
                >
                    {btnLoading ? '⏳ Submitting…' : '🚀 Launch Fund Raiser'}
                </button>
            </form>
        </div>
    );
};

export default FundRiserForm;