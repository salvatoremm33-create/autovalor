import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--black)', borderTop: '3px solid var(--red-primary)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '48px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: 'var(--red-primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚗</div>
              <span style={{ color: 'var(--white)', fontWeight: 900, fontSize: 18 }}>Auto<span style={{ color: 'var(--red-primary)' }}>Valor</span></span>
            </div>
            <p style={{ color: 'var(--gray-400)', fontSize: 14, lineHeight: 1.6, maxWidth: 240 }}>
              La guía más completa de precios de autos usados en México. Datos reales del mercado.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--white)', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Herramientas</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { to: '/valuacion', label: 'Valuación de Autos' },
                { to: '/valuacion', label: 'Precios de Mercado' },
                { to: '/valuacion', label: 'Calculadora de Crédito' }
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} style={{ color: 'var(--gray-400)', fontSize: 14, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--red-light)'}
                    onMouseLeave={e => e.target.style.color = 'var(--gray-400)'}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--white)', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Marcas Populares</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Nissan', 'Chevrolet', 'Toyota', 'Volkswagen', 'Honda'].map(brand => (
                <li key={brand}>
                  <Link to="/valuacion" style={{ color: 'var(--gray-400)', fontSize: 14, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--red-light)'}
                    onMouseLeave={e => e.target.style.color = 'var(--gray-400)'}
                  >{brand}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--white)', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empresa</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Acerca de', 'Metodología', 'Privacidad', 'Términos'].map(item => (
                <li key={item}>
                  <span style={{ color: 'var(--gray-400)', fontSize: 14 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--dark-2)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
            © {new Date().getFullYear()} AutoValor. Todos los derechos reservados. Precios de referencia, no garantizados.
          </p>
          <p style={{ color: 'var(--gray-600)', fontSize: 12 }}>
            Datos obtenidos de MercadoLibre México y otras fuentes del mercado
          </p>
        </div>
      </div>
    </footer>
  );
}
