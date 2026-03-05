import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';

const Navbar = () => {
    const router = useRouter();
    const [openMenu, setOpenMenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    const account = useSelector((state) => state.web3Reducer.account);

    useEffect(() => { setMounted(true); }, []);

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/my-contributions', label: 'My Contributions' },
    ];

    return (
        <nav
            style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: 36, height: 36,
                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                            borderRadius: 10,
                            boxShadow: '0 0 16px rgba(124,58,237,0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                        }}>⬡</div>
                        <span style={{
                            fontWeight: 700, fontSize: '1.1rem',
                            background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.01em',
                        }}>
                            CrowdFund
                        </span>
                    </div>

                    {/* Desktop nav links */}
                    <div className="hidden sm:flex gap-2">
                        {navLinks.map(({ href, label }) => {
                            const active = router.pathname === href;
                            return (
                                <Link key={href} href={href}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.45rem 1.1rem',
                                        borderRadius: 999,
                                        fontSize: '0.875rem',
                                        fontWeight: active ? 700 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                        background: active
                                            ? 'linear-gradient(135deg, rgba(124,58,237,0.45), rgba(59,130,246,0.35))'
                                            : 'transparent',
                                        border: active
                                            ? '1px solid rgba(167,139,250,0.45)'
                                            : '1px solid transparent',
                                        color: active ? '#e2e8f0' : 'rgba(200,215,255,0.65)',
                                        boxShadow: active ? '0 0 12px rgba(124,58,237,0.25)' : 'none',
                                    }}>
                                        {label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Wallet address pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {mounted && account && (
                            <div style={{
                                background: 'rgba(167,139,250,0.1)',
                                border: '1px solid rgba(167,139,250,0.3)',
                                borderRadius: 999,
                                padding: '0.35rem 0.9rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#c4b5fd',
                                fontFamily: 'monospace',
                                letterSpacing: '0.03em',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                maxWidth: 160, whiteSpace: 'nowrap',
                            }}>
                                {account.slice(0, 6)}…{account.slice(-4)}
                            </div>
                        )}
                        {/* Avatar dot */}
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                            boxShadow: '0 0 12px rgba(167,139,250,0.55)',
                        }} />

                        {/* Mobile hamburger */}
                        <button
                            className="sm:hidden"
                            onClick={() => setOpenMenu(!openMenu)}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 8, padding: '6px 10px',
                                color: '#e2e8f0', cursor: 'pointer',
                                fontSize: 16,
                            }}
                        >
                            {openMenu ? '✕' : '☰'}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {openMenu && (
                    <div style={{
                        padding: '0.75rem 0 1rem',
                        display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                        {navLinks.map(({ href, label }) => (
                            <Link key={href} href={href}>
                                <span
                                    onClick={() => setOpenMenu(false)}
                                    style={{
                                        display: 'block',
                                        padding: '0.6rem 1rem',
                                        borderRadius: 12,
                                        fontSize: '0.9rem', fontWeight: 500,
                                        color: router.pathname === href ? '#e2e8f0' : 'rgba(200,215,255,0.65)',
                                        background: router.pathname === href
                                            ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                    {label}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;