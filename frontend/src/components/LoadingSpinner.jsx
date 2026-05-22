import React from 'react';

export function LoadingSpinner({ size = 40, color = 'var(--red-primary)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <div style={{
        width: size, height: size,
        border: `3px solid var(--gray-200)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function SkeletonBlock({ width = '100%', height = 20, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />
  );
}

export function PageLoader({ message = 'Cargando...' }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16
    }}>
      <LoadingSpinner size={52} />
      <p style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{message}</p>
    </div>
  );
}
