import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMXN } from '../../services/api';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--black)', color: 'var(--white)', borderRadius: 8,
      padding: '10px 14px', fontSize: 13, boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--dark-2)'
    }}>
      <div style={{ color: 'var(--gray-400)', marginBottom: 4, fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--red-light)' }}>{formatMXN(payload[0]?.value)}</div>
      {payload[1] && <div style={{ color: 'var(--gray-400)', fontSize: 12 }}>Rango: {formatMXN(payload[1]?.value)}</div>}
    </div>
  );
}

export default function PriceHistory({ history, make, model, year }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ background: 'var(--white)', borderRadius: 16, padding: '28px 24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 8 }}>Historial de Precios</h2>
        <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
            Aún no hay suficientes datos históricos para este vehículo. El historial se construirá con el tiempo.
          </p>
        </div>
      </div>
    );
  }

  const chartData = history.map(h => ({
    date: new Date(h.recorded_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    avg: h.avg_price,
    min: h.min_price,
    max: h.max_price,
    samples: h.sample_count
  }));

  const lastPrice = history[history.length - 1]?.avg_price;
  const firstPrice = history[0]?.avg_price;
  const priceChange = lastPrice - firstPrice;
  const pctChange = firstPrice ? ((priceChange / firstPrice) * 100).toFixed(1) : 0;

  return (
    <div style={{ background: 'var(--white)', borderRadius: 16, padding: '28px 24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>Historial de Precios</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            {make} {model} {year} • Últimos {history.length} registros
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>Variación</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: priceChange >= 0 ? 'var(--red-primary)' : 'var(--green)' }}>
            {priceChange >= 0 ? '▲' : '▼'} {Math.abs(pctChange)}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--gray-400)' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}K`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="avg" stroke="#C41E3A" strokeWidth={2.5} fill="url(#priceGrad)" dot={{ fill: '#C41E3A', r: 3 }} activeDot={{ r: 5, fill: '#C41E3A' }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Precio mínimo', value: formatMXN(Math.min(...history.map(h => h.min_price))) },
          { label: 'Precio promedio', value: formatMXN(Math.round(history.reduce((s, h) => s + h.avg_price, 0) / history.length)) },
          { label: 'Precio máximo', value: formatMXN(Math.max(...history.map(h => h.max_price))) },
          { label: 'Total anuncios', value: history.reduce((s, h) => s + (h.sample_count || 0), 0).toLocaleString() }
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, minWidth: 100, background: 'var(--gray-50)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
