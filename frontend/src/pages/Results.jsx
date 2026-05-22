import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PriceSummary from '../components/results/PriceSummary';
import ListingsGrid from '../components/results/ListingsGrid';
import AIAnalysis from '../components/results/AIAnalysis';
import PriceHistory from '../components/results/PriceHistory';
import FinancingCalculator from '../components/results/FinancingCalculator';
import { PageLoader } from '../components/LoadingSpinner';
import { getPriceEstimate, getListings } from '../services/api';

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const params = {
    make: searchParams.get('make'),
    model: searchParams.get('model'),
    year: parseInt(searchParams.get('year')),
    trim: searchParams.get('trim') || undefined,
    mileage: parseInt(searchParams.get('mileage')),
    condition: searchParams.get('condition')
  };

  const [priceData, setPriceData] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [listingsOffset, setListingsOffset] = useState(0);
  const [listingsSort, setListingsSort] = useState('price_asc');
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('price');

  const LISTINGS_LIMIT = 12;

  // Validate required params — deps intentionally omitted: params and navigate are stable on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!params.make || !params.model || !params.year || !params.mileage || !params.condition) {
      navigate('/valuacion');
    }
  }, []);

  // Fetch price estimate — runs once on mount; params come from URL and don't change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoading(true);
    setError(null);
    getPriceEstimate({
      make: params.make,
      model: params.model,
      year: params.year,
      trim: params.trim,
      mileage: params.mileage,
      condition: params.condition
    })
      .then(data => setPriceData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch listings
  const fetchListings = useCallback(async (sort, offset, append = false) => {
    setListingsLoading(true);
    try {
      const data = await getListings({
        make: params.make,
        model: params.model,
        year: params.year,
        sort,
        limit: LISTINGS_LIMIT,
        offset,
        fair_market: priceData?.prices?.fairMarketValue
      });
      if (append) {
        setListings(prev => [...prev, ...data.listings]);
      } else {
        setListings(data.listings);
      }
      setListingsTotal(data.total);
    } catch (err) {
      console.error('Listings error:', err);
    } finally {
      setListingsLoading(false);
    }
  }, [params.make, params.model, params.year, priceData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (priceData) {
      setListingsOffset(0);
      fetchListings(listingsSort, 0, false);
    }
  }, [priceData, listingsSort]);

  const handleSortChange = (newSort) => {
    setListingsSort(newSort);
    setListingsOffset(0);
    fetchListings(newSort, 0, false);
  };

  const handleLoadMore = () => {
    const newOffset = listingsOffset + LISTINGS_LIMIT;
    setListingsOffset(newOffset);
    fetchListings(listingsSort, newOffset, true);
  };

  const tabs = [
    { id: 'price', label: '💰 Valuación' },
    { id: 'listings', label: `🔍 Anuncios${listingsTotal ? ` (${listingsTotal})` : ''}` },
    { id: 'history', label: '📈 Historial' },
    { id: 'analysis', label: '🤖 Análisis IA' },
    { id: 'financing', label: '💳 Crédito' }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <PageLoader message={`Valuando ${params.make} ${params.model} ${params.year}...`} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 8 }}>Error al obtener datos</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>{error}</p>
            <button
              onClick={() => navigate('/valuacion')}
              style={{ background: 'var(--red-primary)', color: 'var(--white)', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none' }}
            >
              Intentar de Nuevo
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Header />

      <div style={{ flex: 1 }}>
        {/* Breadcrumb */}
        <div style={{ background: 'var(--black)', padding: '12px 0', borderBottom: '1px solid var(--dark-2)' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-400)', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/')} style={{ color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}>Inicio</button>
              <span>›</span>
              <button onClick={() => navigate('/valuacion')} style={{ color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}>Valuación</button>
              <span>›</span>
              <span style={{ color: 'var(--gray-200)' }}>{params.make} {params.model} {params.year}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 64, zIndex: 50 }}>
          <div className="container">
            <div className="results-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 20px', fontSize: 14, fontWeight: 600, border: 'none',
                    background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    color: activeTab === tab.id ? 'var(--red-primary)' : 'var(--gray-500)',
                    borderBottom: activeTab === tab.id ? '3px solid var(--red-primary)' : '3px solid transparent',
                    transition: 'all 0.2s', marginBottom: -1
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '32px 16px 80px' }}>
          {/* Always visible: compact vehicle summary */}
          {activeTab !== 'price' && priceData && (
            <div style={{
              background: 'var(--black)', borderRadius: 12, padding: '16px 24px',
              marginBottom: 24, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div>
                <span style={{ color: 'var(--white)', fontWeight: 700, fontSize: 16 }}>
                  {params.make} {params.model} {params.year}
                </span>
                {params.trim && <span style={{ color: 'var(--gray-400)', fontSize: 14, marginLeft: 8 }}>{params.trim}</span>}
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Mercado Justo</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red-light)' }}>
                    ${(priceData.prices.fairMarketValue / 1000).toFixed(0)}K
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Intercambio</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-300)' }}>
                    ${(priceData.prices.tradeIn.mid / 1000).toFixed(0)}K
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Concesionario</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-300)' }}>
                    ${(priceData.prices.dealerRetail.mid / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('price')}
                style={{ color: 'var(--red-light)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Ver detalles →
              </button>
            </div>
          )}

          {/* Tab content */}
          {activeTab === 'price' && priceData && (
            <PriceSummary prices={priceData.prices} vehicle={priceData.vehicle} />
          )}

          {activeTab === 'listings' && (
            <ListingsGrid
              listings={listings}
              total={listingsTotal}
              fairMarket={priceData?.prices?.fairMarketValue}
              onSortChange={handleSortChange}
              onLoadMore={handleLoadMore}
              loading={listingsLoading}
            />
          )}

          {activeTab === 'history' && (
            <PriceHistory
              history={priceData?.priceHistory || []}
              make={params.make}
              model={params.model}
              year={params.year}
            />
          )}

          {activeTab === 'analysis' && priceData && (
            <AIAnalysis analysis={priceData.analysis} />
          )}

          {activeTab === 'financing' && priceData && (
            <FinancingCalculator vehiclePrice={priceData.prices.fairMarketValue} />
          )}

          {/* New search CTA */}
          <div style={{
            marginTop: 40, background: 'var(--white)', borderRadius: 16,
            padding: '28px 32px', border: '1px solid var(--gray-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
                ¿Quieres valuar otro auto?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
                Valuación gratuita en menos de 60 segundos
              </p>
            </div>
            <button
              onClick={() => navigate('/valuacion')}
              style={{
                background: 'var(--red-primary)', color: 'var(--white)',
                fontSize: 15, fontWeight: 700, padding: '12px 28px',
                borderRadius: 9, border: 'none', cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--red-dark)'}
              onMouseLeave={e => e.target.style.background = 'var(--red-primary)'}
            >
              Nueva Valuación →
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
