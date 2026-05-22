import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { formatMXN } from '../services/api';

const stats = [
  { value: '50,000+', label: 'Valuaciones al mes' },
  { value: '200,000+', label: 'Anuncios analizados' },
  { value: '20+', label: 'Marcas disponibles' },
  { value: '98%', label: 'Precisión de precios' }
];

const features = [
  { icon: '📊', title: 'Precio Justo de Mercado', desc: 'Calculamos el valor real basado en miles de anuncios activos en México.' },
  { icon: '🤖', title: 'Análisis con IA', desc: 'Nuestra IA analiza tendencias y te dice si es buen momento para comprar.' },
  { icon: '💰', title: 'Calculadora de Crédito', desc: 'Simula tu financiamiento con tasas de los principales bancos mexicanos.' },
  { icon: '📈', title: 'Historial de Precios', desc: 'Observa cómo ha evolucionado el precio del vehículo en los últimos meses.' },
  { icon: '🔍', title: 'Anuncios Verificados', desc: 'Comparamos precios de MercadoLibre y otras fuentes en tiempo real.' },
  { icon: '🏆', title: 'Metodología Transparente', desc: 'Explicamos cómo calculamos cada precio para que confíes en el resultado.' }
];

const popularSearches = [
  { make: 'Nissan', model: 'Versa', year: 2022, price: 195000 },
  { make: 'Chevrolet', model: 'Aveo', year: 2021, price: 165000 },
  { make: 'Toyota', model: 'Corolla', year: 2022, price: 298000 },
  { make: 'Volkswagen', model: 'Jetta', year: 2021, price: 285000 },
  { make: 'Kia', model: 'Sportage', year: 2022, price: 370000 },
  { make: 'Honda', model: 'CR-V', year: 2021, price: 420000 }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--black) 0%, #2D0A12 50%, var(--black) 100%)',
        color: 'var(--white)',
        padding: '80px 0 100px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(196,30,58,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(196,30,58,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(196,30,58,0.2)', border: '1px solid rgba(196,30,58,0.4)',
              borderRadius: 'var(--radius-full)', padding: '6px 16px',
              fontSize: 13, fontWeight: 600, color: 'var(--red-light)',
              marginBottom: 28, letterSpacing: '0.3px'
            }}>
              🇲🇽 Hecho para el mercado mexicano
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 900,
              lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1.5px'
            }}>
              Conoce el Valor Real<br />
              <span style={{ color: 'var(--red-primary)' }}>de tu Auto</span>
            </h1>

            <p style={{
              fontSize: 18, color: 'var(--gray-300)', lineHeight: 1.6,
              marginBottom: 40, maxWidth: 520, margin: '0 auto 40px'
            }}>
              Valuación gratuita basada en precios reales del mercado mexicano.
              Como Kelley Blue Book, pero para México.
            </p>

            <button
              onClick={() => navigate('/valuacion')}
              style={{
                background: 'var(--red-primary)', color: 'var(--white)',
                fontSize: 18, fontWeight: 700, padding: '16px 48px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
                display: 'inline-flex', alignItems: 'center', gap: 10
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--red-dark)'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.background = 'var(--red-primary)'; e.target.style.transform = 'none'; }}
            >
              🚗 Valuar mi Auto Gratis
            </button>

            <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 16 }}>
              Sin registro • Sin costo • Resultados en segundos
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--red-primary)', padding: '32px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24 }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.5px' }}>{value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Searches */}
      <section style={{ padding: '64px 0', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.5px', marginBottom: 10 }}>
              Búsquedas Populares
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 16 }}>Los autos más valuados esta semana</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {popularSearches.map(({ make, model, year, price }) => (
              <button
                key={`${make}-${model}-${year}`}
                onClick={() => navigate('/valuacion', { state: { preselect: { make, model, year } } })}
                style={{
                  background: 'var(--white)', border: '2px solid var(--gray-200)',
                  borderRadius: 14, padding: '20px 24px',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>🚗</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>
                      {make} {model}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{year} • Seminuevo</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 2 }}>Desde</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red-primary)' }}>
                    {formatMXN(price)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 0', background: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.5px', marginBottom: 10 }}>
              ¿Por qué AutoValor?
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              La única herramienta de valuación diseñada específicamente para el mercado automotriz mexicano.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                padding: '28px 24px', boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--gray-200)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--red-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
              >
                <div style={{
                  width: 52, height: 52, background: 'var(--red-pale)',
                  borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, marginBottom: 16
                }}>{icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--red-primary), var(--red-dark))',
        padding: '64px 0', textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--white)', marginBottom: 16, letterSpacing: '-0.5px' }}>
            ¿Listo para conocer el valor de tu auto?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 36 }}>
            Valuación gratuita en menos de 60 segundos
          </p>
          <button
            onClick={() => navigate('/valuacion')}
            style={{
              background: 'var(--white)', color: 'var(--red-primary)',
              fontSize: 17, fontWeight: 800, padding: '16px 48px',
              borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
          >
            Comenzar Valuación →
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
