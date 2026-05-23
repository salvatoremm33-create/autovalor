import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getMakes, getModels, getYears, getTrims } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const STEPS = [
  { id: 'make', label: 'Marca', icon: '🏭' },
  { id: 'model', label: 'Modelo', icon: '🚗' },
  { id: 'year', label: 'Año', icon: '📅' },
  { id: 'trim', label: 'Versión', icon: '⚙️' },
  { id: 'mileage', label: 'Kilometraje', icon: '🛣️' },
  { id: 'condition', label: 'Condición', icon: '⭐' }
];

const CONDITIONS = [
  {
    id: 'excellent', label: 'Excelente', icon: '⭐',
    desc: 'Como nuevo. Sin defectos mecánicos ni estéticos. Historial de servicio completo.'
  },
  {
    id: 'good', label: 'Bueno', icon: '👍',
    desc: 'Pequeñas marcas o rayones. Mecánicamente perfecto. Servicio al corriente.'
  },
  {
    id: 'fair', label: 'Regular', icon: '👌',
    desc: 'Algunos daños mecánicos o estéticos menores. Puede necesitar mantenimiento.'
  },
  {
    id: 'poor', label: 'Deficiente', icon: '🔧',
    desc: 'Problemas mecánicos significativos o daños grandes. Requiere reparaciones.'
  }
];

const MILEAGE_PRESETS = [
  { label: 'Menos de 20,000', value: 15000 },
  { label: '20,000 – 50,000', value: 35000 },
  { label: '50,000 – 80,000', value: 65000 },
  { label: '80,000 – 120,000', value: 100000 },
  { label: '120,000 – 180,000', value: 150000 },
  { label: 'Más de 180,000', value: 200000 }
];

function StepBar({ currentStep }) {
  return (
    <div className="step-bar">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        return (
          <React.Fragment key={step.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: isCompleted ? 'var(--red-primary)' : isActive ? 'var(--red-primary)' : 'var(--gray-200)',
                color: isCompleted || isActive ? 'var(--white)' : 'var(--gray-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isCompleted ? 18 : 14, fontWeight: 700,
                transition: 'all 0.3s', boxShadow: isActive ? '0 0 0 4px rgba(196,30,58,0.2)' : 'none'
              }}>
                {isCompleted ? '✓' : step.icon}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isActive ? 'var(--red-primary)' : isCompleted ? 'var(--gray-700)' : 'var(--gray-400)',
                whiteSpace: 'nowrap'
              }}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                height: 2, width: 32, flexShrink: 0,
                background: i < currentStep ? 'var(--red-primary)' : 'var(--gray-200)',
                margin: '0 4px', marginBottom: 22, transition: 'background 0.3s'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SelectionGrid({ items, selected, onSelect, keyField = 'id', labelField = 'name', subtitleField = null, emptyMessage = 'No hay opciones disponibles' }) {
  if (!items.length) {
    return <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '40px 0' }}>{emptyMessage}</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
      {items.map(item => {
        const isSelected = selected === item[keyField];
        return (
          <button
            key={item[keyField]}
            onClick={() => onSelect(item)}
            style={{
              padding: '14px 12px', borderRadius: 10, border: '2px solid',
              borderColor: isSelected ? 'var(--red-primary)' : 'var(--gray-200)',
              background: isSelected ? 'var(--red-pale)' : 'var(--white)',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              boxShadow: isSelected ? '0 0 0 3px rgba(196,30,58,0.15)' : 'var(--shadow-sm)'
            }}
            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--gray-300)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}}
            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? 'var(--red-dark)' : 'var(--gray-900)' }}>
              {item[labelField]}
            </div>
            {subtitleField && item[subtitleField] && (
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{item[subtitleField]}</div>
            )}
            {item.popular && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 10, background: 'var(--red-pale)', color: 'var(--red-primary)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Popular</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [trims, setTrims] = useState([]);

  const [selected, setSelected] = useState({
    make: null, makeId: null,
    model: null, modelId: null,
    year: null, yearId: null,
    trim: null, trimId: null,
    mileage: null,
    condition: null
  });

  const [mileageInput, setMileageInput] = useState('');
  const [mileageError, setMileageError] = useState('');

  useEffect(() => {
    setLoading(true);
    getMakes()
      .then(data => setMakes([...data].sort((a, b) => a.name.localeCompare(b.name, 'es'))))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectMake = async (make) => {
    setSelected(s => ({ ...s, make: make.name, makeId: make.id, model: null, modelId: null, year: null, yearId: null, trim: null, trimId: null }));
    setLoading(true);
    setError(null);
    try {
      const data = await getModels(make.id);
      setModels(data);
      setCurrentStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (model) => {
    setSelected(s => ({ ...s, model: model.name, modelId: model.id, year: null, yearId: null, trim: null, trimId: null }));
    setLoading(true);
    setError(null);
    try {
      const data = await getYears(model.id);
      setYears(data);
      setCurrentStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectYear = async (yearObj) => {
    setSelected(s => ({ ...s, year: yearObj.year, yearId: yearObj.id, trim: null, trimId: null }));
    setLoading(true);
    setError(null);
    try {
      const data = await getTrims(yearObj.id);
      setTrims(data);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrim = (trim) => {
    setSelected(s => ({ ...s, trim: trim.name, trimId: trim.id }));
    setCurrentStep(4);
  };

  const handleMileageSubmit = () => {
    const km = parseInt(mileageInput.replace(/,/g, '').trim());
    if (!mileageInput || isNaN(km) || km < 0) {
      setMileageError('Ingresa un kilometraje válido');
      return;
    }
    if (km > 999999) {
      setMileageError('Kilometraje máximo: 999,999 km');
      return;
    }
    setMileageError('');
    setSelected(s => ({ ...s, mileage: km }));
    setCurrentStep(5);
  };

  const handleSelectCondition = (conditionId) => {
    setSelected(s => ({ ...s, condition: conditionId }));
    // Navigate to results
    const params = new URLSearchParams({
      make: selected.make,
      model: selected.model,
      year: selected.year,
      trim: selected.trim || '',
      mileage: selected.mileage,
      condition: conditionId
    });
    navigate(`/resultados?${params.toString()}`);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const stepTitles = [
    `Selecciona la Marca`,
    `Selecciona el Modelo de ${selected.make || ''}`,
    `Selecciona el Año del ${selected.model || ''}`,
    `Selecciona la Versión`,
    `Ingresa el Kilometraje`,
    `¿En qué Condición está?`
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Header />

      <div style={{ flex: 1, padding: '40px 0 80px' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.5px' }}>
                Valuación de Auto
              </h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                Paso {currentStep + 1} de {STEPS.length}
              </p>
            </div>
            {currentStep > 0 && (
              <button
                onClick={goBack}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'var(--gray-600)', fontSize: 14, fontWeight: 500,
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid var(--gray-200)', background: 'var(--white)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                ← Atrás
              </button>
            )}
          </div>

          <StepBar currentStep={currentStep} />

          {/* Selected summary */}
          {currentStep > 0 && (
            <div style={{
              background: 'var(--black)', borderRadius: 10, padding: '12px 20px',
              marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
              flexWrap: 'wrap'
            }}>
              {selected.make && <span style={{ color: 'var(--white)', fontWeight: 600, fontSize: 15 }}>{selected.make}</span>}
              {selected.model && <><span style={{ color: 'var(--gray-600)' }}>›</span><span style={{ color: 'var(--gray-300)', fontSize: 15 }}>{selected.model}</span></>}
              {selected.year && <><span style={{ color: 'var(--gray-600)' }}>›</span><span style={{ color: 'var(--gray-300)', fontSize: 15 }}>{selected.year}</span></>}
              {selected.trim && <><span style={{ color: 'var(--gray-600)' }}>›</span><span style={{ color: 'var(--red-light)', fontSize: 14 }}>{selected.trim}</span></>}
              {selected.mileage !== null && <><span style={{ color: 'var(--gray-600)' }}>›</span><span style={{ color: 'var(--gray-400)', fontSize: 14 }}>{selected.mileage.toLocaleString()} km</span></>}
            </div>
          )}

          {/* Main card */}
          <div style={{
            background: 'var(--white)', borderRadius: 16, padding: '32px',
            boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-200)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 24 }}>
              {stepTitles[currentStep]}
            </h2>

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                padding: '12px 16px', marginBottom: 20, color: '#DC2626', fontSize: 14
              }}>
                ⚠️ {error}
              </div>
            )}

            {loading && <LoadingSpinner />}

            {!loading && (
              <>
                {/* Step 0: Make */}
                {currentStep === 0 && (
                  <SelectionGrid
                    items={makes}
                    selected={selected.makeId}
                    onSelect={handleSelectMake}
                    keyField="id"
                    labelField="name"
                    subtitleField="country"
                  />
                )}

                {/* Step 1: Model */}
                {currentStep === 1 && (
                  <SelectionGrid
                    items={models}
                    selected={selected.modelId}
                    onSelect={handleSelectModel}
                    keyField="id"
                    labelField="name"
                    subtitleField="body_type"
                  />
                )}

                {/* Step 2: Year */}
                {currentStep === 2 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                    {years.map(y => (
                      <button
                        key={y.id}
                        onClick={() => handleSelectYear(y)}
                        style={{
                          padding: '20px 12px', borderRadius: 10, border: '2px solid',
                          borderColor: selected.yearId === y.id ? 'var(--red-primary)' : 'var(--gray-200)',
                          background: selected.yearId === y.id ? 'var(--red-pale)' : 'var(--white)',
                          cursor: 'pointer', fontSize: 18, fontWeight: 700,
                          color: selected.yearId === y.id ? 'var(--red-dark)' : 'var(--gray-900)',
                          transition: 'all 0.15s'
                        }}
                      >
                        {y.year}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: Trim */}
                {currentStep === 3 && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {trims.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTrim(t)}
                          style={{
                            padding: '16px 20px', borderRadius: 10, border: '2px solid',
                            borderColor: selected.trimId === t.id ? 'var(--red-primary)' : 'var(--gray-200)',
                            background: selected.trimId === t.id ? 'var(--red-pale)' : 'var(--white)',
                            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: selected.trimId === t.id ? 'var(--red-dark)' : 'var(--gray-900)' }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 3 }}>
                              {[t.engine, t.transmission, t.fuel_type].filter(Boolean).join(' • ')}
                            </div>
                          </div>
                          {t.msrp_mxn && (
                            <div style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>MSRP est.</div>
                              <div style={{ fontWeight: 700 }}>
                                ${Math.round(t.msrp_mxn / 1000)}K
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => { setSelected(s => ({ ...s, trim: null, trimId: null })); setCurrentStep(4); }}
                      style={{ marginTop: 16, color: 'var(--gray-500)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      No sé la versión exacta
                    </button>
                  </>
                )}

                {/* Step 4: Mileage */}
                {currentStep === 4 && (
                  <div style={{ maxWidth: 440 }}>
                    <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>
                      El kilometraje es uno de los factores más importantes en la valuación.
                    </p>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 8 }}>
                        Kilometraje exacto (km)
                      </label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="text"
                          placeholder="Ej. 45,000"
                          value={mileageInput}
                          onChange={e => { setMileageInput(e.target.value); setMileageError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleMileageSubmit()}
                          style={{
                            flex: 1, padding: '12px 16px', fontSize: 16, borderRadius: 8,
                            border: `2px solid ${mileageError ? '#dc2626' : 'var(--gray-300)'}`,
                            outline: 'none', transition: 'border 0.2s',
                            fontWeight: 600
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--red-primary)'}
                          onBlur={e => e.target.style.borderColor = mileageError ? '#dc2626' : 'var(--gray-300)'}
                        />
                        <button
                          onClick={handleMileageSubmit}
                          style={{
                            background: 'var(--red-primary)', color: 'var(--white)',
                            fontSize: 15, fontWeight: 700, padding: '0 24px',
                            borderRadius: 8, cursor: 'pointer', border: 'none',
                            transition: 'background 0.2s', whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => e.target.style.background = 'var(--red-dark)'}
                          onMouseLeave={e => e.target.style.background = 'var(--red-primary)'}
                        >
                          Continuar →
                        </button>
                      </div>
                      {mileageError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{mileageError}</p>}
                    </div>

                    <div>
                      <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 12 }}>O elige un rango aproximado:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {MILEAGE_PRESETS.map(({ label, value }) => (
                          <button
                            key={value}
                            onClick={() => { setMileageInput(value.toLocaleString()); setSelected(s => ({ ...s, mileage: value })); setCurrentStep(5); }}
                            style={{
                              padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray-200)',
                              background: 'var(--gray-50)', cursor: 'pointer', fontSize: 13,
                              color: 'var(--gray-700)', fontWeight: 500, textAlign: 'left',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red-primary)'; e.currentTarget.style.background = 'var(--red-pale)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Condition */}
                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {CONDITIONS.map(({ id, label, icon, desc }) => (
                      <button
                        key={id}
                        onClick={() => handleSelectCondition(id)}
                        style={{
                          padding: '20px 24px', borderRadius: 12, border: '2px solid var(--gray-200)',
                          background: 'var(--white)', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'flex-start', gap: 16,
                          transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red-primary)'; e.currentTarget.style.background = 'var(--red-pale)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                      >
                        <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>{desc}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--gray-300)', fontSize: 20 }}>→</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
