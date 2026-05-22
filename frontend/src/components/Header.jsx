import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const styles = {
  header: {
    background: 'var(--black)',
    borderBottom: '3px solid var(--red-primary)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 20px rgba(0,0,0,0.4)'
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    gap: 16
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none'
  },
  logoIcon: {
    width: 38,
    height: 38,
    background: 'var(--red-primary)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0
  },
  logoText: {
    fontSize: 22,
    fontWeight: 900,
    color: 'var(--white)',
    letterSpacing: '-0.5px'
  },
  logoSpan: {
    color: 'var(--red-primary)'
  },
  tagline: {
    fontSize: 10,
    color: 'var(--gray-400)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginTop: 1
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  navLink: {
    color: 'var(--gray-300)',
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: 6,
    transition: 'all 0.2s',
    textDecoration: 'none'
  },
  navLinkActive: {
    color: 'var(--white)',
    background: 'rgba(196,30,58,0.15)'
  },
  ctaBtn: {
    background: 'var(--red-primary)',
    color: 'var(--white)',
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 18px',
    borderRadius: 7,
    transition: 'background 0.2s',
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  }
};

export default function Header() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      ...styles.header,
      boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : '0 2px 20px rgba(0,0,0,0.4)'
    }}>
      <div className="container">
        <div style={styles.inner}>
          <Link to="/" style={styles.logo}>
            <div style={styles.logoIcon}>🚗</div>
            <div>
              <div style={styles.logoText}>
                Auto<span style={styles.logoSpan}>Valor</span>
              </div>
              <div style={styles.tagline}>Guía de Precios México</div>
            </div>
          </Link>

          <nav style={styles.nav}>
            {[
              { path: '/', label: 'Inicio' },
              { path: '/valuacion', label: 'Valuación' }
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  ...styles.navLink,
                  ...(isActive(path) ? styles.navLinkActive : {})
                }}
                onMouseEnter={e => { if (!isActive(path)) e.target.style.color = 'var(--white)'; }}
                onMouseLeave={e => { if (!isActive(path)) e.target.style.color = 'var(--gray-300)'; }}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/valuacion"
              style={styles.ctaBtn}
              onMouseEnter={e => e.target.style.background = 'var(--red-dark)'}
              onMouseLeave={e => e.target.style.background = 'var(--red-primary)'}
            >
              Valuar Ahora
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
