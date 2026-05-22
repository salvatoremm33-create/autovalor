import React, { useState, useEffect } from 'react';
import { calculateFinancing, formatMXN } from '../../services/api';

const TERMS = [12, 24, 36, 48, 60];

const BANKS = [
  { name: 'BBVA', rate: 14.9 },
  { name: 'Santander', rate: 15.5 },
  { name: 'Banorte', rate: 16.0 },
  { name: 'HSBC', rate: 15.9 },
  { name: 'Citibanamex', rate: 14.5 }
];

export default function FinancingCalculator({ vehiclePrice }) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [term, setTerm] = useState(48);
  const [rate, setRate] = useState(16.5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const downPayment = Math.round((downPaymentPct / 100) * vehiclePrice);

  useEffect(() => {
    if (!vehiclePrice) return;
    setLoading(true);
    calculateFinancing({ vehiclePrice, downPayment, interestRate: rate, termMonths: term })
      .then(data => setResult(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehiclePrice, downPayment, term, rate]);

  return (
    <div style={{ background: 'var(--white)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #1a2f4d)',
          padding: '20px 24px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24 }}>💰</div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--white)' }}>Calculadora de Crédito</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Simula tu financiamiento</p>
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '24px' }}>
          <div className="financing-cols">
            {/* Left: controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Enganche */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Enganche</label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{downPaymentPct}% = {formatMXN(downPayment)}</span>
                </div>
                <input
                  type="range" min="10" max="60" step="5"
                  value={downPaymentPct}
                  onChange={e => setDownPaymentPct(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--blue)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  <span>10%</span><span>60%</span>
                </div>
              </div>

              {/* Plazo */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 10 }}>Plazo</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {TERMS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTerm(t)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
                        borderColor: term === t ? 'var(--blue)' : 'var(--gray-200)',
                        background: term === t ? 'var(--blue-light)' : 'var(--white)',
                        color: term === t ? 'var(--blue)' : 'var(--gray-600)'
                      }}
                    >
                      {t}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Tasa */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Tasa Anual</label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{rate}%</span>
                </div>
                <input
                  type="range" min="10" max="28" step="0.5"
                  value={rate}
                  onChange={e => setRate(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--blue)' }}
                />

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Tasas de Bancos</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {BANKS.map(b => (
                      <button
                        key={b.name}
                        onClick={() => setRate(b.rate)}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 5,
                          border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                          borderColor: rate === b.rate ? 'var(--blue)' : 'var(--gray-200)',
                          background: rate === b.rate ? 'var(--blue-light)' : 'var(--gray-50)',
                          color: rate === b.rate ? 'var(--blue)' : 'var(--gray-500)'
                        }}
                      >
                        {b.name} {b.rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: results */}
            <div>
              {result && !loading ? (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a5f, #1a2f4d)',
                    borderRadius: 12, padding: '24px', textAlign: 'center', marginBottom: 16
                  }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pago Mensual Estimado
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--white)', letterSpacing: '-1px' }}>
                      {formatMXN(result.monthlyPayment)}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      por {term} meses
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Precio del auto', value: formatMXN(vehiclePrice) },
                      { label: 'Enganche', value: formatMXN(result.downPayment) },
                      { label: 'Monto a financiar', value: formatMXN(result.principal) },
                      { label: 'Costo total del crédito', value: formatMXN(result.totalCost) },
                      { label: 'Total de intereses', value: formatMXN(result.totalInterest) },
                      { label: 'Tasa anual', value: `${result.annualRate}%` }
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 12, lineHeight: 1.5 }}>
                    * Cálculo de referencia. La tasa final depende de tu historial crediticio y el banco.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gray-400)' }}>
                  Calculando...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
