import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Loader from '../components/Loader';
import authWrapper from '../helper/authWrapper';
import { getMyContributionList } from '../redux/interactions';
import Link from 'next/link';

const MyContributions = () => {
    const crowdFundingContract = useSelector((s) => s.fundingReducer.contract);
    const account = useSelector((s) => s.web3Reducer.account);
    const [contributions, setContributions] = useState(null);

    useEffect(() => {
        (async () => {
            if (crowdFundingContract) {
                const res = await getMyContributionList(crowdFundingContract, account);
                setContributions(res);
            }
        })();
    }, [crowdFundingContract]);

    return (
        <div style={{
            maxWidth: 900, margin: '0 auto',
            padding: '2rem 1.5rem',
            position: 'relative', zIndex: 1,
        }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                    fontSize: '1.35rem', fontWeight: 800,
                    background: 'linear-gradient(90deg, #e2e8f0, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                }}>
                    My Contributions
                </h1>
                <p style={{ color: 'rgba(200,215,255,0.45)', fontSize: '0.8rem', marginTop: 2 }}>
                    Projects you have funded
                </p>
            </div>

            {contributions === null ? (
                <Loader />
            ) : contributions.length === 0 ? (
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 20, padding: '3rem 2rem', textAlign: 'center',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💫</div>
                    <h3 style={{ color: '#f472b6', fontWeight: 700, marginBottom: 8 }}>
                        No contributions yet
                    </h3>
                    <p style={{ color: 'rgba(200,215,255,0.45)', fontSize: '0.85rem' }}>
                        Head to the dashboard to find a project to support.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {contributions.map((data, i) => (
                        <div
                            key={i}
                            className="card fade-up"
                            style={{ flex: '1 1 250px', maxWidth: 320 }}
                        >
                            {/* Project address */}
                            <span className="glass-label">Project</span>
                            <Link href={`/project-details/${data.projectAddress}`}>
                                <p style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem', fontWeight: 600,
                                    color: '#a78bfa',
                                    cursor: 'pointer',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    marginBottom: '0.75rem',
                                    transition: 'color 0.2s',
                                }}>
                                    {data.projectAddress}
                                </p>
                            </Link>

                            {/* Amount */}
                            <div className="inner-card">
                                <span className="glass-label">Amount Contributed</span>
                                <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '1.05rem' }}>
                                    {data.amount} ETH
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default authWrapper(MyContributions);