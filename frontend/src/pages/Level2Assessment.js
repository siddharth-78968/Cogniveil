import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictLevel2, generateReferral } from '../utils/api';

const Level2Assessment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [referral, setReferral] = useState(null);
  const [showBMICalc, setShowBMICalc] = useState(false);
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiWeight, setBmiWeight] = useState('');
  const [form, setForm] = useState({
    Country: 'India',
    Age: 65,
    Gender: 'Male',
    Education_Level: 12,
    BMI: 25,
    Physical_Activity: 'Moderate',
    Smoking_Status: 'Never',
    AlcoholConsumption: 'Never',
    Diabetic: 'No',
    Hypertension: 'No',
    CholesterolLevel: 'Normal',
    Family_History: 'No',
    CognitiveScore: 50,
    Depression_Status: 'No',
    Sleep_Quality: 'Good',
    Nutrition_Diet: 'Balanced',
    AirPollution: 'Low',
    EmploymentStatus: 'Retired',
    MaritalStatus: 'Married',
    APOE_e4: 'Negative',
    apoe_e4_provenance: 'self_reported',
    mri_provenance: 'self_reported',
    SocialEngagement: 'Moderate',
    IncomeLevel: 'Middle',
    StressLevels: 'Low',
    UrbanRural: 'Urban',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    const modelForm = {
      ...form,
      CognitiveScore: Math.round((form.CognitiveScore / 100) * 30),
    };
    try {
      const res = await predictLevel2(modelForm);
      setResult(res.data);
      localStorage.setItem('level2Prob', res.data.probability);
      localStorage.setItem('level2Risk', res.data.risk_level);

      // Call MCP Tool 8: generate_referral
      try {
        const refRes = await generateReferral({
          risk_level: res.data.risk_level,
          is_deviating: localStorage.getItem('latestScoreDeviation') === 'true',
          active_score: form.CognitiveScore,
          shap_top_features: res.data.shap_features,
        });
        setReferral(refRes.data);
      } catch (err) {
        console.error('Referral generation error:', err);
      }
    } catch (err) {
      alert('Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#00d4aa';
    if (risk === 'Moderate') return '#f59e0b';
    return '#ef4444';
  };

const inputStyle = {
  backgroundColor: '#0d1117',
  border: '1px solid #ffffff12',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  color: 'white',
  fontSize: '0.95rem',
  width: '100%',
  boxSizing: 'border-box',
};

  const selectStyle = { ...inputStyle };

  const fieldGroup = (label, key, type = 'select', options = [], min, max) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {type === 'select' ? (
        <select style={selectStyle} value={form[key]} onChange={e => update(key, e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="number"
          style={inputStyle}
          value={form[key]}
          min={min}
          max={max}
          onChange={e => update(key, parseFloat(e.target.value))}
        />
      )}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>

        <div style={styles.headerRow}>
          <div style={styles.levelBadge}>LEVEL 2</div>
          <div>
            <p style={styles.pageLabel}>TARGETED ASSESSMENT</p>
            <h1 style={styles.pageTitle}>Clinical Risk Prediction</h1>
            <p style={styles.pageSub}>CatBoost AI model analyses your health profile to predict dementia risk probability.</p>
          </div>
        </div>

        {!result ? (
          <>
            {/* Progress */}
            <div style={styles.progressRow}>
              {[1, 2, 3].map(s => (
                <div key={s} style={styles.progressStep}>
                  <div style={{
                    ...styles.progressDot,
                    backgroundColor: step >= s ? '#a78bfa' : '#ffffff10',
                    border: step === s ? '2px solid #a78bfa' : '2px solid transparent',
                  }}>
                    {step > s ? '✓' : s}
                  </div>
                  <span style={{ ...styles.progressLabel, color: step >= s ? '#a78bfa' : '#ffffff25' }}>
                    {s === 1 ? 'Personal' : s === 2 ? 'Medical' : 'Lifestyle'}
                  </span>
                </div>
              ))}
              <div style={styles.progressLine} />
            </div>

            <div style={styles.formCard}>
 {/* Step 1 — Personal */}
{step === 1 && (
  <>
    <h2 style={styles.stepTitle}>👤 Personal Information</h2>
    <div style={styles.formGrid}>
      {fieldGroup('Age', 'Age', 'number', [], 18, 120)}
      {fieldGroup('Gender', 'Gender', 'select', ['Male', 'Female'])}
      {fieldGroup('Education Level (years)', 'Education_Level', 'number', [], 0, 30)}
      {fieldGroup('Country', 'Country', 'select', ['India', 'USA', 'UK', 'Canada', 'Australia', 'Other'])}
      <div style={styles.field}>
  <label style={styles.label}>BMI</label>
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <input
    type="number"
    style={{ ...inputStyle }}
    value={form['BMI']}
    min={10} max={50}
    onChange={e => update('BMI', parseFloat(e.target.value))}
    placeholder="e.g. 22.5"
  />
  <button
    type="button"
    style={styles.calcBtn}
    onClick={() => setShowBMICalc(true)}
  >
    🧮 Calculate BMI →
  </button>
</div>
  <span style={styles.hint}>Body Mass Index. Click Calculate if you don't know it.</span>

  {showBMICalc && (
    <div style={styles.bmiPopup}>
      <p style={styles.bmiPopupTitle}>🧮 BMI Calculator</p>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Height (cm)</label>
          <input
            type="number"
            style={{ ...inputStyle, fontSize: '1rem', padding: '0.9rem', width: '100%' }}
            value={bmiHeight}
            onChange={e => setBmiHeight(e.target.value)}
            placeholder="e.g. 170"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Weight (kg)</label>
          <input
            type="number"
            style={{ ...inputStyle, fontSize: '1rem', padding: '0.9rem', width: '100%' }}
            value={bmiWeight}
            onChange={e => setBmiWeight(e.target.value)}
            placeholder="e.g. 70"
          />
        </div>
      </div>

      {bmiHeight && bmiWeight && (
        <div style={styles.bmiResult}>
          {(() => {
            const bmi = (bmiWeight / ((bmiHeight / 100) ** 2)).toFixed(1);
            const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
            const color = bmi < 18.5 ? '#f59e0b' : bmi < 25 ? '#00d4aa' : bmi < 30 ? '#f59e0b' : '#ef4444';
            return (
              <>
                <p style={{ color, fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>{bmi}</p>
                <p style={{ color, fontSize: '0.82rem', margin: '2px 0 8px' }}>{cat}</p>
              </>
            );
          })()}
          <button
            type="button"
            style={styles.bmiUseBtn}
            onClick={() => {
              const bmi = (bmiWeight / ((bmiHeight / 100) ** 2)).toFixed(1);
              update('BMI', parseFloat(bmi));
              setShowBMICalc(false);
            }}
          >
            Use this BMI →
          </button>
        </div>
      )}

      <button
        type="button"
        style={styles.bmiCloseBtn}
        onClick={() => setShowBMICalc(false)}
      >
        Close
      </button>
    </div>
  )}
</div>
      {fieldGroup('Marital Status', 'MaritalStatus', 'select', ['Married', 'Single', 'Divorced', 'Widowed'])}
      {fieldGroup('Employment Status', 'EmploymentStatus', 'select', ['Employed', 'Retired', 'Unemployed', 'Self-employed'])}
      {fieldGroup('Urban vs Rural', 'UrbanRural', 'select', ['Urban', 'Rural'])}
    </div>
  </>
)}

{/* Step 2 — Medical */}
{step === 2 && (
  <>
    <h2 style={styles.stepTitle}>🧬 Medical History</h2>
    <div style={styles.formGrid}>
      {fieldGroup('Diabetes', 'Diabetic', 'select', ['No', 'Yes'])}
      {fieldGroup('Hypertension', 'Hypertension', 'select', ['No', 'Yes'])}
      {fieldGroup('Cholesterol Level', 'CholesterolLevel', 'select', ['Normal', 'High', 'Low'])}
      {fieldGroup("Family History of Alzheimer's", 'Family_History', 'select', ['No', 'Yes'])}
      <div style={styles.field}>
  <label style={styles.label}>APOE-ε4 Gene</label>
  <select style={selectStyle} value={form['APOE_e4']} onChange={e => update('APOE_e4', e.target.value)}>
    <option value="Negative">Negative</option>
    <option value="Positive">Positive</option>
  </select>
  <span style={styles.hint}>From a genetic test report. If unknown, select Negative (most common).</span>
</div>
      {fieldGroup('Depression Level', 'Depression_Status', 'select', ['No', 'Mild', 'Moderate', 'Severe'])}
      {fieldGroup('Sleep Quality', 'Sleep_Quality', 'select', ['Good', 'Fair', 'Poor'])}
      <div style={styles.field}>
<label style={styles.label}>CogniScore (0-100)</label>
  <input type="number" style={inputStyle} value={form['CognitiveScore']} min={0} max={100} onChange={e => update('CognitiveScore', parseFloat(e.target.value))} />
  <span style={styles.hint}>Your CogniScore from the dashboard (0-100). If unknown, enter 50.</span>
</div>
    </div>
  </>
)}

{/* Step 3 — Lifestyle */}
{step === 3 && (
  <>
    <h2 style={styles.stepTitle}>🏃 Lifestyle Factors</h2>
    <div style={styles.formGrid}>
      {fieldGroup('Smoking Status', 'Smoking_Status', 'select', ['Never', 'Former', 'Current'])}
      {fieldGroup('Alcohol Consumption', 'AlcoholConsumption', 'select', ['Never', 'Rarely', 'Moderate', 'Heavy'])}
      {fieldGroup('Physical Activity', 'Physical_Activity', 'select', ['Sedentary', 'Light', 'Moderate', 'Active'])}
      {fieldGroup('Dietary Habits', 'Nutrition_Diet', 'select', ['Balanced', 'Mediterranean', 'High Fat', 'Vegetarian'])}
      {fieldGroup('Air Pollution Exposure', 'AirPollution', 'select', ['Low', 'Moderate', 'High'])}
      {fieldGroup('Social Engagement', 'SocialEngagement', 'select', ['Low', 'Moderate', 'High'])}
      {fieldGroup('Stress Levels', 'StressLevels', 'select', ['Low', 'Moderate', 'High'])}
      {fieldGroup('Income Level', 'IncomeLevel', 'select', ['Low', 'Middle', 'High'])}
      
    </div>
  </>
)}

              {/* Navigation */}
              <div style={styles.navRow}>
                {step > 1 && (
                  <button style={styles.prevBtn} onClick={() => setStep(step - 1)}>← Previous</button>
                )}
                {step < 3 ? (
                  <button style={styles.nextBtn} onClick={() => setStep(step + 1)}>Next →</button>
                ) : (
                  <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                    {loading ? '⏳ Analysing...' : '🔬 Get Risk Prediction'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Results */
          <div style={styles.resultContainer}>
            <div style={{
              ...styles.resultCard,
              borderColor: getRiskColor(result.risk_level) + '44',
              boxShadow: `0 0 40px ${getRiskColor(result.risk_level)}15`,
            }}>
              <p style={styles.cardLabel}>CATBOOST AI PREDICTION</p>

              <div style={styles.probMeter}>
                <div style={styles.probTrack}>
                  <div style={{
                    ...styles.probFill,
                    width: `${result.probability * 100}%`,
                    backgroundColor: getRiskColor(result.risk_level),
                  }} />
                </div>
                <div style={styles.probLabels}>
                  <span style={{ color: '#00d4aa', fontSize: '0.75rem' }}>Low Risk</span>
                  <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Moderate</span>
                  <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>High Risk</span>
                </div>
              </div>

              <div style={styles.probScore}>
                <span style={{ ...styles.probNum, color: getRiskColor(result.risk_level) }}>
                  {Math.round(result.probability * 100)}%
                </span>
                <span style={styles.probLabel}>Dementia Risk Probability</span>
              </div>

              <div style={{
                ...styles.riskPill,
                backgroundColor: getRiskColor(result.risk_level) + '20',
                border: `1px solid ${getRiskColor(result.risk_level)}44`,
                color: getRiskColor(result.risk_level),
              }}>
                {result.risk_level === 'Low' ? '✓' : result.risk_level === 'Moderate' ? '⚡' : '⚠️'} {result.risk_level} Risk
              </div>

              <div style={styles.modelInfo}>
                <p style={styles.modelInfoText}>
                  Predicted by CatBoost Classifier trained on demographic, medical, genetic and lifestyle features.
                  Accuracy ≈ 73% · ROC-AUC ≈ 0.81
                </p>
              </div>

              {/* Explicit Clinical Referral Recommendation */}
              {referral && (
                <div style={{
                  backgroundColor: '#0d1117',
                  border: `1px solid ${getRiskColor(result.risk_level)}55`,
                  borderRadius: '16px',
                  padding: '1.2rem',
                  marginTop: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: getRiskColor(result.risk_level), fontWeight: '700', fontSize: '0.95rem' }}>
                      📋 ACTIONABLE CLINICAL REFERRAL RECOMMENDATION
                    </span>
                    <span style={{
                      backgroundColor: getRiskColor(result.risk_level) + '22',
                      color: getRiskColor(result.risk_level),
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: '700'
                    }}>
                      Urgency: {referral.urgency} ({referral.timeframe})
                    </span>
                  </div>
                  <h4 style={{ color: 'white', margin: '4px 0 8px', fontSize: '1.1rem' }}>{referral.action}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <strong>Recommended Specialist:</strong> {referral.recommended_specialist}
                  </p>
                  <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                    {referral.clinical_rationale}
                  </p>
                </div>
              )}

              {/* Conditional Tier 3 (MRI) Workup Prompt */}
              {(result.risk_level === 'Moderate' || result.risk_level === 'High') && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(59,130,246,0.12) 100%)',
                  border: '1px solid #a78bfa44',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  marginTop: '1.2rem',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ color: '#a78bfa', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                      CONDITIONAL WORKUP ACTIVATED
                    </span>
                    <h4 style={{ color: 'white', margin: '4px 0 4px', fontSize: '1.05rem' }}>
                      🧠 Structural Neuroimaging (Level 3 MRI) Indicated
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                      Based on your Moderate/High Tier 2 risk, run an MRI scan analysis as an independent confirmatory panel.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/level3')}
                    style={{
                      background: 'linear-gradient(135deg, #a78bfa 0%, #3b82f6 100%)',
                      border: 'none',
                      color: 'white',
                      fontWeight: '700',
                      padding: '0.75rem 1.2rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      whiteSpace: 'nowrap',
                      marginLeft: '12px'
                    }}
                  >
                    Proceed to MRI Panel →
                  </button>
                </div>
              )}

              {/* SHAP Feature Importance Chart */}
              {result.shap_features && result.shap_features.length > 0 && (
                <div style={styles.shapCard}>
                  <p style={styles.shapTitle}>🔍 What's driving your risk?</p>
                  <p style={styles.shapSub}>Each bar shows how much a factor increased or decreased your risk score.</p>
                  <div style={styles.shapList}>
                    {result.shap_features.map((f, i) => {
                      const isRisk = f.value > 0;
                      const color = isRisk ? '#ef4444' : '#00d4aa';
                      const maxVal = Math.max(...result.shap_features.map(x => Math.abs(x.value)));
                      const barWidth = Math.round((Math.abs(f.value) / maxVal) * 100);
                      return (
                        <div key={i} style={styles.shapRow}>
                          <div style={styles.shapFeatureName}>
                            <span style={styles.shapFeatureLabel}>{f.feature}</span>
                            <span style={styles.shapFeatureInput}>{f.input}</span>
                          </div>
                          <div style={styles.shapBarContainer}>
                            <div style={{
                              ...styles.shapBar,
                              width: `${barWidth}%`,
                              backgroundColor: color,
                              boxShadow: `0 0 8px ${color}44`,
                            }} />
                          </div>
                          <span style={{ ...styles.shapValue, color }}>
                            {isRisk ? '+' : ''}{f.value.toFixed(3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={styles.shapLegend}>
                    <span style={styles.shapLegendItem}>
                      <span style={{ ...styles.shapLegendDot, backgroundColor: '#ef4444' }} />
                      Increases risk
                    </span>
                    <span style={styles.shapLegendItem}>
                      <span style={{ ...styles.shapLegendDot, backgroundColor: '#00d4aa' }} />
                      Reduces risk
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.actionRow}>
              <button style={styles.retryBtn} onClick={() => { setResult(null); setStep(1); }}>
                🔄 Retake Assessment
              </button>
              <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>
                View Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        select option { background-color: #0d1117; color: white; }
        input:focus, select:focus { outline: none !important; border-color: #a78bfa55 !important; }
      `}</style>
    </div>
    
  );

};

const styles = {
  page: {
    minHeight: '100vh', backgroundColor: '#080c14',
    padding: '2rem', position: 'relative', overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  bgGlow1: {
    position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
    top: '-150px', right: '-100px', pointerEvents: 'none', animation: 'glow 7s ease-in-out infinite',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    backgroundSize: '40px 40px', pointerEvents: 'none',
  },
  container: { maxWidth: '780px', margin: '0 auto', animation: 'fadeUp 0.5s ease' },
  backBtn: { background: 'none', border: 'none', color: '#ffffff35', fontSize: '0.88rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' },
  headerRow: { display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' },
  levelBadge: {
    backgroundColor: '#a78bfa20', border: '1px solid #a78bfa44',
    color: '#a78bfa', fontSize: '0.7rem', fontWeight: '700',
    padding: '0.3rem 0.8rem', borderRadius: '20px', letterSpacing: '0.1em',
    whiteSpace: 'nowrap', marginTop: '4px',
  },
  pageLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '0.25rem' },
  pageTitle: { color: 'white', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' },
  pageSub: { color: '#ffffff40', fontSize: '0.88rem', lineHeight: 1.6 },
  progressRow: {
    display: 'flex', alignItems: 'center', gap: '0',
    marginBottom: '2rem', position: 'relative',
    justifyContent: 'space-between', maxWidth: '400px',
  },
  progressStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', zIndex: 1 },
  progressDot: {
    width: '36px', height: '36px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: '700', color: 'white',
    transition: 'all 0.3s',
  },
  progressLabel: { fontSize: '0.72rem', fontWeight: '600', letterSpacing: '0.04em' },
  progressLine: {
    position: 'absolute', top: '18px', left: '18px',
    right: '18px', height: '2px',
    backgroundColor: '#ffffff10', zIndex: 0,
  },
  formCard: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff08',
    borderRadius: '20px', padding: '2rem',
  },
  stepTitle: { color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#ffffff50', fontSize: '0.78rem', fontWeight: '500', letterSpacing: '0.03em' },
  hint: { color: '#ffffff25', fontSize: '0.7rem', lineHeight: 1.4, marginTop: '2px' },
  navRow: { display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
  prevBtn: {
    backgroundColor: 'transparent', color: '#ffffff50',
    border: '1px solid #ffffff15', borderRadius: '10px',
    padding: '0.75rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer',
  },
  nextBtn: {
    backgroundColor: '#a78bfa', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#a78bfa', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 0 20px rgba(167,139,250,0.3)',
  },
  resultContainer: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  resultCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '20px', padding: '2.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
  },
  cardLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', alignSelf: 'flex-start' },
  probMeter: { width: '100%' },
  probTrack: { height: '8px', backgroundColor: '#ffffff08', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' },
  probFill: { height: '100%', borderRadius: '4px', transition: 'width 1s ease' },
  probLabels: { display: 'flex', justifyContent: 'space-between' },
  probScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  probNum: { fontSize: '4rem', fontWeight: '800', lineHeight: 1 },
  probLabel: { color: '#ffffff40', fontSize: '0.88rem' },
  riskPill: { padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '700' },
  modelInfo: {
    backgroundColor: '#ffffff05', borderRadius: '10px',
    padding: '1rem', width: '100%',
  },
  modelInfoText: { color: '#ffffff30', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.6 },
  alertBox: {
    backgroundColor: '#ef444415', border: '1px solid #ef444430',
    borderRadius: '10px', padding: '1rem', width: '100%',
  },
  alertText: { color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' },
  actionRow: { display: 'flex', gap: '1rem' },
  retryBtn: {
    flex: 1, backgroundColor: 'transparent', color: '#ffffff50',
    border: '1px solid #ffffff15', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', cursor: 'pointer',
  },
  dashBtn: {
    flex: 1, backgroundColor: '#a78bfa', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  calcBtn: {
  backgroundColor: '#a78bfa20',
  color: '#a78bfa',
  border: '1px solid #a78bfa44',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  fontSize: '0.82rem',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
},
bmiPopup: {
  backgroundColor: '#0d1117',
  border: '1px solid #a78bfa33',
  borderRadius: '14px',
  padding: '1.25rem',
  marginTop: '0.75rem',
  width: '100%',
  boxSizing: 'border-box',
},
bmiPopupTitle: {
  color: 'white',
  fontSize: '0.9rem',
  fontWeight: '700',
  marginBottom: '1rem',
},
bmiResult: {
  backgroundColor: '#ffffff05',
  borderRadius: '10px',
  padding: '1rem',
  textAlign: 'center',
  marginBottom: '0.75rem',
},
bmiUseBtn: {
  backgroundColor: '#a78bfa',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '0.5rem 1.25rem',
  fontSize: '0.85rem',
  fontWeight: '600',
  cursor: 'pointer',
},
bmiCloseBtn: {
  backgroundColor: 'transparent',
  color: '#ffffff30',
  border: '1px solid #ffffff10',
  borderRadius: '8px',
  padding: '0.4rem 1rem',
  fontSize: '0.8rem',
  cursor: 'pointer',
  width: '100%',
},
shapCard: {
    backgroundColor: '#ffffff05',
    border: '1px solid #ffffff10',
    borderRadius: '16px',
    padding: '1.5rem',
    width: '100%',
  },
  shapTitle: {
    color: 'white',
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
  },
  shapSub: {
    color: '#ffffff35',
    fontSize: '0.75rem',
    marginBottom: '1.25rem',
    lineHeight: 1.5,
  },
  shapList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  shapRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr 60px',
    alignItems: 'center',
    gap: '0.75rem',
  },
  shapFeatureName: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  shapFeatureLabel: {
    color: '#ffffffaa',
    fontSize: '0.78rem',
    fontWeight: '600',
  },
  shapFeatureInput: {
    color: '#ffffff30',
    fontSize: '0.68rem',
  },
  shapBarContainer: {
    height: '8px',
    backgroundColor: '#ffffff08',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  shapBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.8s ease',
  },
  shapValue: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  shapLegend: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #ffffff08',
  },
  shapLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#ffffff35',
    fontSize: '0.72rem',
  },
  shapLegendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

};

export default Level2Assessment;
