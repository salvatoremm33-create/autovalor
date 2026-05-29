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

        {markers.map(({ label, val, color }) => (
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

const SOURCE_LABELS = {
  autocosmos:   'Autocosmos',
  autometrica:  'Guía Autométrica',
  kavak:        'Kavak',
  seminuevos:   'Seminuevos'
};

function PriceGuidePanel({ priceGuide }) {
  if (!priceGuide) return null;
  const { entries, avgBuyPrice, avgSellPrice } = priceGuide;

  const sources = [...new Set(entries.map(e => e.source).filter(Boolean))];
  const sourceLabel = sources.map(s => SOURCE_LABELS[s] || s).join(' / ') || 'Referencia';

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 14, padding: '24px',
      border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', marginBottom: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2 }}>
            Precios de Referencia — {sourceLabel}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            Guía de precios publicados por versión
          </p>
        </div>
        {(avgBuyPrice || avgSellPrice) && (
          <div style={{ display: 'flex', gap: 24 }}>
            {avgBuyPrice && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>Compra promedio</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{formatMXN(avgBuyPrice)}</div>
              </div>
            )}
            {avgSellPrice && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>Venta promedio</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)' }}>{formatMXN(avgSellPrice)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--gray-500)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Versión</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--gray-500)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Precio Compra</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--gray-500)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Precio Venta</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 8).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? 'transparent' : 'var(--gray-50)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-700)', fontWeight: 500 }}>
                    {row.trim_name || 'Versión base'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                    {row.buy_price_mxn ? formatMXN(row.buy_price_mxn) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--blue)', fontWeight: 700 }}>
                    {row.sell_price_mxn ? formatMXN(row.sell_price_mxn) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length > 8 && (
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8, textAlign: 'right' }}>
              +{entries.length - 8} versiones más
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MarketTrendBadge({ marketTrend }) {
  if (!marketTrend) return null;
  const { arrow, label, pctChange, color } = marketTrend;
  const sign = pctChange > 0 ? '+' : '';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
      background: color + '22', border: `1px solid ${color}55`,
      borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color
    }}>
      <span>{arrow}</span>
      <span>Mercado {label}</span>
      {Math.abs(pctChange) >= 0.1 && (
        <span style={{ opacity: 0.85 }}>({sign}{parseFloat(pctChange).toFixed(1)}%)</span>
      )}
    </div>
  );
}

function BuyerAdvicePanel({ vehicle }) {
  const { year, mileageKm, condition } = vehicle;
  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(1, currentYear - year);
  const avgKmPerYear = Math.round(mileageKm / ageYears);
  const expectedKm = ageYears * 14000;
  const kmDiff = mileageKm - expectedKm;

  const advices = [];

  // Mileage advice
  if (avgKmPerYear < 10000) {
    advices.push({
      icon: '✓', type: 'positive', title: 'Kilometraje bajo',
      text: `${avgKmPerYear.toLocaleString()} km/año — muy por debajo del promedio nacional (14,000 km/año). Indica uso moderado y menor desgaste mecánico. Puede justificar un precio más alto.`
    });
  } else if (avgKmPerYear > 20000) {
    advices.push({
      icon: '!', type: 'warning', title: 'Kilometraje alto',
      text: `${avgKmPerYear.toLocaleString()} km/año — por encima del promedio. Solicita revisión de motor, transmisión y frenos antes de comprar. Negocia descuento adicional.`
    });
  } else {
    const diffAbs = Math.round(Math.abs(kmDiff) / 1000);
    const diffText = kmDiff > 0
      ? `Lleva ${diffAbs}k km más de lo esperado para su año.`
      : `Lleva ${diffAbs}k km menos de lo esperado — positivo.`;
    advices.push({
      icon: 'i', type: 'neutral', title: 'Kilometraje normal',
      text: `${avgKmPerYear.toLocaleString()} km/año — dentro del promedio nacional. ${diffText}`
    });
  }

  // Year / age advice
  if (ageYears <= 2) {
    advices.push({
      icon: '✓', type: 'positive', title: `Auto reciente (${ageYears} año${ageYears !== 1 ? 's' : ''})`,
      text: `Probablemente dentro de garantía de fábrica. La depreciación inicial ya ocurrió — buen equilibrio entre precio y tecnología actual.`
    });
  } else if (ageYears <= 5) {
    advices.push({
      icon: 'i', type: 'neutral', title: `${ageYears} años de antigüedad`,
      text: `Depreciación moderada completada. Verifica estado de garantías extendidas. Buena relación precio-tecnología.`
    });
  } else if (ageYears <= 10) {
    advices.push({
      icon: 'i', type: 'neutral', title: `${ageYears} años de antigüedad`,
      text: `Depreciación significativa ya aplicada. Presupuesta correa de distribución, líquidos y frenos si no se han reemplazado recientemente.`
    });
  } else {
    advices.push({
      icon: '!', type: 'warning', title: `${ageYears} años de antigüedad`,
      text: `Vehículo mayor. Considera inspección mecánica completa. La depreciación está casi completa — el precio debería ser muy accesible.`
    });
  }

  // Condition advice
  const conditionAdvice = {
    excellent: { icon: '✓', type: 'positive', title: 'Condición excelente', text: 'Auto en estado superior. Solicita historial de servicio completo para validar. Precio premium es justificado.' },
    good:      { icon: '✓', type: 'positive', title: 'Buena condición',     text: 'Desgaste normal para su uso. Revisa luces, líquidos y neumáticos. Poco margen de negociación esperado.' },
    fair:      { icon: '!', type: 'warning',  title: 'Condición regular',   text: 'Puede tener detalles mecánicos o estéticos. Negocia considerando costo de reparaciones (~$5,000–$15,000 MXN).' },
    poor:      { icon: '!', type: 'warning',  title: 'Condición deficiente', text: 'Requiere reparaciones. Pide cotización de taller antes de cerrar. Un descuento de 15–25% es razonable.' }
  };
  advices.push(conditionAdvice[condition] || conditionAdvice.good);

  const typeStyles = {
    positive: { bg: 'var(--green-light)', border: '#bbf7d0', text: '#15803d' },
    warning:  { bg: 'var(--yellow-light)', border: '#fde68a', text: '#b45309' },
    neutral:  { bg: 'var(--blue-light)',   border: '#bfdbfe', text: '#1d4ed8' }
  };

  return (
    <div style={{ marginTop: 20, background: 'var(--white)', borderRadius: 14, padding: '20px 24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 14 }}>
        Consejo del Valuador
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {advices.map((a, i) => {
          const s = typeStyles[a.type];
          return (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.text, color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 2 }}>{a.title}</div>
                <p style={{ fontSize: 13, color: s.text, lineHeight: 1.5, margin: 0 }}>{a.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PriceSummary({ prices, vehicle, priceGuide, analysis }) {
  if (!prices) return null;

  const { fairMarketValue, privateSale, dealerRetail, tradeIn, adjustments } = prices;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease both' }}>
      {/* Vehicle Header */}
      <div className="vehicle-header" style={{
        background: 'linear-gradient(135deg, var(--black), #1a0208)',
        borderRadius: 16, marginBottom: 24,
        border: '1px solid var(--dark-2)', color: 'var(--white)'
      }}>
        <div className="vehicle-header-inner" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--red-light)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Valuación AutoValor
            </div>
            <h1 className="vehicle-title" style={{ fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8 }}>
              {vehicle.make} {vehicle.model} {vehicle.year}
              {vehicle.trim && <span className="vehicle-trim" style={{ color: 'var(--gray-400)', marginLeft: 8 }}>{vehicle.trim}</span>}
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
            {analysis?.marketTrend && (
              <MarketTrendBadge marketTrend={analysis.marketTrend} />
            )}
          </div>
          <div className="vehicle-price-block">
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Precio Justo de Mercado</div>
            <div className="fair-market-value" style={{ fontWeight: 900, color: 'var(--red-light)', letterSpacing: '-1px' }}>
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

      {/* Autocosmos reference prices */}
      <PriceGuidePanel priceGuide={priceGuide} />

      {/* Three columns */}
      <div className="price-cols">
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

      {/* Buyer Advice */}
      <BuyerAdvicePanel vehicle={vehicle} />
    </div>
  );
}
