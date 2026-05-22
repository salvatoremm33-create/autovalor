import React, { useState } from 'react';

const insightTypeStyles = {
  positive: { bg: 'var(--green-light)', border: '#bbf7d0', text: '#15803d', icon: '✓' },
  warning:  { bg: 'var(--yellow-light)', border: '#fde68a', text: '#b45309', icon: '!' },
  neutral:  { bg: 'var(--blue-light)', border: '#bfdbfe', text: '#1d4ed8', icon: 'i' },
  info:     { bg: 'var(--gray-100)', border: 'var(--gray-200)', text: 'var(--gray-600)', icon: 'i' }
};

function ScoreMeter({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 40;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gray-200)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 600 }}>/ 100</div>
      </div>
    </div>
  );
}

export default function AIAnalysis({ analysis }) {
  const [expanded, setExpanded] = useState(true);

  if (!analysis) return null;

  const { score, recommendation, insights, summary, aiSummary } = analysis;

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--black), #1a0208)',
          padding: '20px 24px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24 }}>🤖</div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--white)' }}>Análisis AutoValor AI</h2>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Evaluación inteligente del mercado</p>
          </div>
        </div>
        <span style={{ color: 'var(--gray-400)', fontSize: 20 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '24px' }}>
          {/* Score + Recommendation */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <ScoreMeter score={score} />
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 6, fontWeight: 600 }}>PUNTUACIÓN</div>
            </div>

            {recommendation && (
              <div style={{
                flex: 1, background: recommendation.color + '15',
                border: `2px solid ${recommendation.color}`,
                borderRadius: 12, padding: '16px 20px', minWidth: 200
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Recomendación AutoValor
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: recommendation.color, marginBottom: 6 }}>
                  {recommendation.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
                  {recommendation.description}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {(aiSummary || summary) && (
            <div style={{
              background: 'var(--gray-50)', borderRadius: 10, padding: '16px 20px',
              marginBottom: 20, borderLeft: '4px solid var(--red-primary)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red-primary)', marginBottom: 6, textTransform: 'uppercase' }}>
                {aiSummary ? 'Análisis IA' : 'Resumen de Mercado'}
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>
                {aiSummary || summary}
              </p>
            </div>
          )}

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Hallazgos Clave
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((insight, i) => {
                  const s = insightTypeStyles[insight.type] || insightTypeStyles.info;
                  return (
                    <div key={i} style={{
                      background: s.bg, border: `1px solid ${s.border}`,
                      borderRadius: 8, padding: '10px 14px',
                      display: 'flex', gap: 10, alignItems: 'flex-start'
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: s.text, color: 'var(--white)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1
                      }}>
                        {s.icon}
                      </div>
                      <p style={{ fontSize: 13, color: s.text, lineHeight: 1.5, margin: 0 }}>
                        {insight.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
