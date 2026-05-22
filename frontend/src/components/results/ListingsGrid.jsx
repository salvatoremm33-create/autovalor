import React, { useState } from 'react';
import { formatMXN, formatNumber } from '../../services/api';

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'mileage_asc', label: 'Menor kilometraje' },
  { value: 'newest', label: 'Más recientes' }
];

function ListingCard({ listing, fairMarket }) {
  const { label: ratingLabel, color: ratingColor } = listing.priceRating || {};
  const priceDiff = fairMarket ? listing.price_mxn - fairMarket : null;

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 12,
      border: '1px solid var(--gray-200)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
      display: 'flex', flexDirection: 'column'
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Image area */}
      <div style={{
        height: 160, background: 'var(--gray-100)', position: 'relative',
        overflow: 'hidden', flexShrink: 0
      }}>
        {listing.thumbnail_url ? (
          <img
            src={listing.thumbnail_url}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🚗</div>
        )}

        {/* Source badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: listing.source === 'mercadolibre' ? '#FFE600' : 'var(--blue)',
          color: listing.source === 'mercadolibre' ? '#333' : 'var(--white)',
          fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: '0.3px'
        }}>
          {listing.source === 'mercadolibre' ? 'MercadoLibre' : listing.source}
        </div>

        {/* Price rating badge */}
        {ratingLabel && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: ratingColor, color: 'var(--white)',
            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4
          }}>
            {ratingLabel}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', lineHeight: 1.3, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.title || `${listing.make_name} ${listing.model_name} ${listing.year}`}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {listing.mileage_km && (
            <span style={{ fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              {formatNumber(listing.mileage_km)} km
            </span>
          )}
          {listing.color && (
            <span style={{ fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 4 }}>
              {listing.color}
            </span>
          )}
          {listing.seller_type && (
            <span style={{ fontSize: 11, background: listing.seller_type === 'dealer' ? 'var(--blue-light)' : 'var(--green-light)', color: listing.seller_type === 'dealer' ? 'var(--blue)' : 'var(--green)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              {listing.seller_type === 'dealer' ? 'Agencia' : 'Particular'}
            </span>
          )}
        </div>

        {(listing.location_city || listing.location_state) && (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 10 }}>
            📍 {[listing.location_city, listing.location_state].filter(Boolean).join(', ')}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.5px' }}>
              {formatMXN(listing.price_mxn)}
            </div>
            {priceDiff !== null && (
              <div style={{ fontSize: 11, color: priceDiff <= 0 ? 'var(--green)' : 'var(--red-primary)', fontWeight: 600, marginTop: 2 }}>
                {priceDiff <= 0 ? '▼' : '▲'} {formatMXN(Math.abs(priceDiff))} vs. justo
              </div>
            )}
          </div>

          {listing.url && (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--red-primary)', color: 'var(--white)',
                fontSize: 12, fontWeight: 700, padding: '7px 14px',
                borderRadius: 7, textDecoration: 'none', transition: 'background 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--red-dark)'}
              onMouseLeave={e => e.target.style.background = 'var(--red-primary)'}
            >
              Ver Anuncio →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsGrid({ listings, total, fairMarket, onSortChange, onLoadMore, loading }) {
  const [sort, setSort] = useState('price_asc');

  const handleSort = (newSort) => {
    setSort(newSort);
    onSortChange && onSortChange(newSort);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)' }}>Anuncios del Mercado</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            {total > 0 ? `${total} anuncios encontrados` : 'Buscando anuncios...'}
          </p>
        </div>
        <select
          value={sort}
          onChange={e => handleSort(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gray-300)',
            fontSize: 13, fontWeight: 500, color: 'var(--gray-700)',
            background: 'var(--white)', cursor: 'pointer', outline: 'none'
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {listings.length === 0 && !loading ? (
        <div style={{
          background: 'var(--white)', borderRadius: 12, padding: '48px 24px',
          textAlign: 'center', border: '1px solid var(--gray-200)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8 }}>
            Sin anuncios activos
          </h3>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
            No encontramos anuncios recientes para este vehículo. El precio se calculó con datos históricos.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} fairMarket={fairMarket} />
            ))}
          </div>

          {listings.length < total && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={onLoadMore}
                disabled={loading}
                style={{
                  background: 'var(--white)', color: 'var(--gray-700)',
                  fontSize: 14, fontWeight: 600, padding: '12px 32px',
                  borderRadius: 8, border: '2px solid var(--gray-300)',
                  cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Cargando...' : `Ver más anuncios (${total - listings.length} restantes)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
