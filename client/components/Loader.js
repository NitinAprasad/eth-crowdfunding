const Loader = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '1.5rem',
    }}>
      {/* Spinning ring */}
      <div style={{
        width: 52, height: 52,
        borderRadius: '50%',
        border: '3px solid rgba(167,139,250,0.15)',
        borderTopColor: '#a78bfa',
        borderRightColor: '#60a5fa',
        animation: 'spinLoader 0.9s linear infinite',
      }} />
      <p style={{
        color: 'rgba(200,215,255,0.5)',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.04em',
      }}>
        Loading projects…
      </p>
      <style>{`
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;