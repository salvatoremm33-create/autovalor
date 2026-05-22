import React from 'react';
import { formatMXN } from '../../services/api';

function PriceColumn({ title, subtitle, low, high, mid, color, isHighlighted }) {
  return (
    <div style={{
      background: isHighlighted ? 'var(--black)' : 'var(--white)',
      borderRadius: 14, padding: '24px 20px',
      border: isHighlighted ? '2px solid var(--red-primary)' : '2px solid var(--gray-200)',
      flex: 1, textAlign: 'center', position: 'relative',
      boxShadow: isHighlighted ? '0 8px 30px rgba(196,30,58,0.2)' : 'var(--shadow-sm)',
      transform: isHighlighted ? 'scale(1.04)' : 'none',
      transition: 'all 0.3s'
    }}>
      {isHighlighted && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--red-primary)', color: 'var(--white)',
          fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20,
          letterSpacing: '0.5px', whiteSpace: 'nowrap'
        }}>
          ★ PRECIO JUSTO DE MERCADO
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: isHighlighted ? 'var(--gray-400)' : 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: isHighlighted ? 'var(--white)' : color, marginBottom: 4, letterSpacing: '-0.5px' }}>
        {formatMXN(mid)}
      </div>
      <div style={{ fontSize: 12, color: isHighlighted ? 'var(--gray-500)' : 'var(--gray-400)', marginBottom: 12 }}>
        {formatMXN(low)} – {formatMXN(high)}
      </div>
      <div style={{ fontSize: 12, color: isHighlighted ? 'var(--gray-400)' : 'var(--gray-400)', lineHeight: 1.5 }}>
        {subtitle}
      </div>
    </div>
  );
}

function PriceGauge({ fairMarket, tradeInMid, dealerMid, privateMid }) {
  const min = tradeInMid * 0.85;
  const max = dealerMid * 1.1;
  const range = max - min;

  const getPos = (val) => Math.max(0, Math.min(100, ((val - min) / range) * 100));

  const markers = [
    { label: 'Intercambio', val: tradeInMid, color: '#6B7280' },
    { label: 'Privado', val: privateMid, color: '#d97706' },
    { label: 'Justo', val: fairMarket, color: '#dc2626' },
    { label: 'Concesionario', val: dealerMid, color: '#2563eb' }
  ];

  return (
    <div style={{ background: 'var(--white)', borderRadius: 14, padding: '28px 24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>Rango de Precios del Mercado</h3>

      <div style={{ position: 'relative', height: 28, marginBottom: 32, marginTop: 8 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)',
          height: 10, borderRadius: 5,
          background: 'linear-gradient(to right, #6B7280, #d97706, #dc2626, #2563eb)'
        }} />

        {markers.map(({ label, val, color }, i) => (
          <div key={label} style={{
            position: 'absolute', left: `${getPos(val)}%`,
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <div style={{ width: 16, height: 16, background: color, borderRadius: '50%', border: '3px solid var(--white)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 2 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {markers.map(({ label, val, color }) => (
          <div key={label} style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
            <div style={{ width: 10, height: 10, background: color, borderRadius: '50%', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', marginTop: 2 }}>{formatMXN(val)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PriceSummary({ prices, vehicle }) {
  if (!prices) return null;

  const { fairMarketValue, privateSale, dealerRetail, tradeIn, adjustments } = prices;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease both' }}>
      {/* Vehicle Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--black), #1a0208)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        border: '1px solid var(--dark-2)', color: 'var(--white)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--red-light)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Valuación AutoValor
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8 }}>
              {vehicle.make} {vehicle.model} {vehicle.year}
              {vehicle.trim && <span style={{ color: 'var(--gray-400)', fontSize: 18, marginLeft: 8 }}>{vehicle.trim}</span>}
            </h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Kilometraje', value: `${vehicle.mileageKm?.toLocaleString()} km` },
                { label: 'Condición', value: { excellent: 'Excelente', good: 'Buena', fair: 'Regular', poor: 'Deficiente' }[vehicle.condition] || vehicle.condition },
                vehicle.engine && { label: 'Motor', value: vehicle.engine }
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label}>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{label}: </span>
                  <span style={{ fontSize: 13, color: 'var(--gray-300)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Precio Justo de Mercado</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--red-light)', letterSpacing: '-1px' }}>
              {formatMXN(fairMarketValue)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>
              Basado en {adjustments.sampleSize} anuncios • {adjustments.dataSource === 'market_listings' ? 'Mercado real' : 'Estimado MSRP'}
            </div>
          </div>
        </div>
      </div>

      {/* Gauge */}
      <PriceGauge
        fairMarket={fairMarketValue}
        tradeInMid={tradeIn.mid}
        dealerMid={dealerRetail.mid}
        privateMid={privateSale.mid}
      />

      {/* Three columns */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <PriceColumn
          title="Intercambio"
          subtitle="Lo que ofrece un concesionario si entregaste tu auto como pago inicial"
          low={tradeIn.low}
          high={tradeIn.high}
          mid={tradeIn.mid}
          color="var(--gray-700)"
        />
        <PriceColumn
          title="Venta Privada"
          subtitle="Precio estimado entre particulares, sin intermediarios"
          low={privateSale.low}
          high={privateSale.high}
          mid={privateSale.mid}
          color="var(--yellow)"
          isHighlighted={true}
        />
        <PriceColumn
          title="Concesionario"
          subtitle="Precio de venta en agencia o distribuidor certificado"
          low={dealerRetail.low}
          high={dealerRetail.high}
          mid={dealerRetail.mid}
          color="var(--blue)"
        />
      </div>

      {/* Adjustments info */}
      <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '16px 20px', border: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 10 }}>Factores de Ajuste Aplicados</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Depreciación', value: `-${adjustments.depreciationPercent}%` },
            { label: 'Condición', value: `${adjustments.conditionMultiplier > 1 ? '+' : ''}${((adjustments.conditionMultiplier - 1) * 100).toFixed(0)}%` },
            { label: 'Km vs. promedio', value: `${adjustments.mileageAdjustment > 0 ? '+' : ''}${adjustments.mileageAdjustment}%` },
            { label: 'Muestra', value: `${adjustments.sampleSize} anuncios` }
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
