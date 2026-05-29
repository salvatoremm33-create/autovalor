/**
 * AutoValor AI Analysis Engine
 * Generates market analysis and recommendations using rule-based logic.
 * Can be extended to call OpenAI or Claude API for richer insights.
 */

const axios = require('axios');

function generateMarketInsights(params) {
  const {
    makeName, modelName, year, trimName, mileageKm,
    condition, prices, listings, priceHistory
  } = params;

  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - year;
  const avgKmPerYear = mileageKm / Math.max(1, vehicleAge);
  const expectedKmPerYear = 14000;

  const insights = [];
  let overallScore = 70;
  let recommendation = 'neutral';

  // Mileage analysis
  if (avgKmPerYear < 10000) {
    insights.push({ type: 'positive', icon: '✓', text: `Bajo kilometraje: ${Math.round(avgKmPerYear).toLocaleString()} km/año (promedio nacional: 14,000 km/año). Indica uso moderado.` });
    overallScore += 10;
  } else if (avgKmPerYear > 20000) {
    insights.push({ type: 'warning', icon: '!', text: `Alto kilometraje: ${Math.round(avgKmPerYear).toLocaleString()} km/año. Considera inspección de motor y transmisión.` });
    overallScore -= 10;
  } else {
    insights.push({ type: 'neutral', icon: 'i', text: `Kilometraje normal: ${Math.round(avgKmPerYear).toLocaleString()} km/año, acorde al promedio nacional.` });
  }

  // Condition analysis
  if (condition === 'excellent') {
    insights.push({ type: 'positive', icon: '✓', text: 'Condición excelente reportada. Los vehículos en esta categoría se venden 15-20% más rápido que el promedio.' });
    overallScore += 8;
  } else if (condition === 'poor') {
    insights.push({ type: 'warning', icon: '!', text: 'Condición deficiente. Considera negociar descuento adicional para cubrir costos de reparación estimados.' });
    overallScore -= 15;
  }

  // Age analysis
  if (vehicleAge <= 3) {
    insights.push({ type: 'positive', icon: '✓', text: `Vehículo relativamente nuevo (${vehicleAge} año${vehicleAge !== 1 ? 's' : ''}). Probablemente aún dentro de garantía de fábrica.` });
    overallScore += 5;
  } else if (vehicleAge >= 8) {
    insights.push({ type: 'info', icon: 'i', text: `Vehículo con ${vehicleAge} años. Presupuesta mantenimiento preventivo: correa de tiempo, líquidos, frenos.` });
  }

  // Market demand insights
  const popularModels = ['Nissan Versa', 'Chevrolet Aveo', 'Toyota Hilux', 'Volkswagen Jetta', 'Kia Sportage'];
  const vehicleKey = `${makeName} ${modelName}`;
  if (popularModels.includes(vehicleKey)) {
    insights.push({ type: 'positive', icon: '✓', text: `${vehicleKey} es uno de los modelos más vendidos en México. Alta demanda = mejor valor de reventa.` });
    overallScore += 5;
  }

  // Price trend from history
  if (priceHistory && priceHistory.length >= 2) {
    const recent = priceHistory[priceHistory.length - 1].avg_price;
    const older = priceHistory[0].avg_price;
    const changePercent = ((recent - older) / older) * 100;

    if (changePercent > 5) {
      insights.push({ type: 'warning', icon: '!', text: `Precios subieron ${changePercent.toFixed(1)}% en los últimos 6 meses. El mercado está al alza — compra pronto.` });
      recommendation = 'buy_now';
      overallScore += 5;
    } else if (changePercent < -5) {
      insights.push({ type: 'positive', icon: '✓', text: `Precios bajaron ${Math.abs(changePercent).toFixed(1)}% en los últimos 6 meses. Buen momento para comprar.` });
      recommendation = 'buy_now';
      overallScore += 8;
    } else {
      insights.push({ type: 'neutral', icon: 'i', text: `Precios estables en los últimos 6 meses (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%). Mercado equilibrado.` });
    }
  }

  // Inventory levels
  if (listings) {
    if (listings.length < 5) {
      insights.push({ type: 'warning', icon: '!', text: `Inventario bajo (${listings.length} anuncios activos). Poca oferta puede limitar tu poder de negociación.` });
      overallScore -= 5;
    } else if (listings.length > 30) {
      insights.push({ type: 'positive', icon: '✓', text: `Alta disponibilidad (${listings.length}+ anuncios activos). Tienes poder de negociación — compara antes de decidir.` });
      overallScore += 5;
    }
  }

  // Final recommendation
  const clampedScore = Math.max(10, Math.min(100, overallScore));

  if (clampedScore >= 80) recommendation = 'buy_now';
  else if (clampedScore >= 60) recommendation = 'consider';
  else recommendation = 'wait';

  const recommendationMap = {
    buy_now:  { label: 'Comprar Ahora', color: '#16a34a', description: 'Las condiciones de mercado son favorables para el comprador.' },
    consider: { label: 'Considerar', color: '#d97706', description: 'Condiciones mixtas — investiga más antes de decidir.' },
    wait:     { label: 'Esperar', color: '#dc2626', description: 'El mercado o el vehículo presentan señales de alerta.' }
  };

  // Market trend derived from price history
  let marketTrend = { direction: 'stable', label: 'Estable', pctChange: 0, color: '#6B7280', arrow: '→' };
  if (priceHistory && priceHistory.length >= 2) {
    const recent = priceHistory[priceHistory.length - 1].avg_price;
    const older = priceHistory[0].avg_price;
    const change = ((recent - older) / older) * 100;
    if (change > 5) {
      marketTrend = { direction: 'rising', label: 'Al Alza', pctChange: change, color: '#dc2626', arrow: '▲' };
    } else if (change < -5) {
      marketTrend = { direction: 'falling', label: 'A la Baja', pctChange: change, color: '#16a34a', arrow: '▼' };
    } else {
      marketTrend = { direction: 'stable', label: 'Estable', pctChange: change, color: '#6B7280', arrow: '→' };
    }
  }

  return {
    score: clampedScore,
    recommendation: recommendationMap[recommendation],
    insights,
    marketTrend,
    summary: `${makeName} ${modelName} ${year} — ${condition === 'excellent' ? 'En excelentes condiciones' : condition === 'good' ? 'En buenas condiciones' : 'Revisar condición'}. El valor de mercado refleja ${vehicleAge > 5 ? 'depreciación significativa' : 'buena retención de valor'} con ${listings ? listings.length : 0} anuncios activos.`
  };
}

async function generateAIAnalysis(params) {
  // If OpenAI key is set, use GPT for richer analysis
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Eres un experto en valuación de autos usados en México. Analiza este vehículo:
Marca: ${params.makeName}, Modelo: ${params.modelName}, Año: ${params.year}
Versión: ${params.trimName}, Kilometraje: ${params.mileageKm?.toLocaleString()} km
Condición: ${params.condition}
Precio justo de mercado: $${params.prices?.fairMarketValue?.toLocaleString()} MXN

Proporciona un análisis conciso en español (máximo 150 palabras) sobre:
1. Valor del vehículo en el mercado mexicano
2. Factores clave que afectan el precio
3. Recomendación para comprador/vendedor`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 10000
      });

      const aiText = response.data.choices[0]?.message?.content;
      const ruleBasedResult = generateMarketInsights(params);

      return { ...ruleBasedResult, aiSummary: aiText };
    } catch (err) {
      // Fall through to rule-based on API error
    }
  }

  return generateMarketInsights(params);
}

module.exports = { generateAIAnalysis, generateMarketInsights };
