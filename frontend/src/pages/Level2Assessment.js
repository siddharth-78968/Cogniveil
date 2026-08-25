import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitLevel2, generateReferral } from '../utils/api';
import ReferralReportModal from '../components/ReferralReportModal';
import VoiceGuideBar from '../components/VoiceGuideBar';
import DoctorLayout from '../components/DoctorLayout';

const Level2Assessment = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [referral, setReferral] = useState(null);
  const [shapFilter, setShapFilter] = useState('all');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showBMICalc, setShowBMICalc] = useState(false);
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiWeight, setBmiWeight] = useState('');
  const [form, setForm] = useState({
    Country: 'India',
    Age: user?.age || 65,
    Gender: user?.gender || 'Male',
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
      const res = await submitLevel2(modelForm);
      setResult(res.data);
      if (refreshUser) await refreshUser();
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
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#1e293b',
    fontSize: '0.9rem',
    fontWeight: '600',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const selectStyle = { 
    ...inputStyle,
    cursor: 'pointer',
  };

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
    <DoctorLayout activeTitle="Tier 2 Biomarkers">
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div style={styles.levelBadge}>TIER 2</div>
          <div>
            <p style={styles.pageLabel}>CLINICAL RISK STRATIFICATION</p>
            <h1 style={styles.pageTitle}>Multi-Domain Health Assessment</h1>
            <p style={styles.pageSub}>CatBoost AI model analyses 24 lifestyle & medical biomarkers to predict dementia risk.</p>
          </div>
        </div>

        {!result ? (
          <>
            <VoiceGuideBar scriptKey="level2_intro" defaultLang="en" />

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

              {/* AI Clinical Summary Narrative */}
              {result.risk_summary && (
                <div style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid #a78bfa33',
                  borderRadius: '14px',
                  padding: '1rem 1.2rem',
                  marginTop: '1.2rem',
                  textAlign: 'left',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1rem' }}>🧠</span>
                    <span style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: '700' }}>
                      AI CLINICAL RISK SYNTHESIS
                    </span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: '0.86rem', lineHeight: '1.55', margin: 0 }}>
                    {result.risk_summary}
                  </p>
                </div>
              )}

              {/* Explicit Clinical Referral Recommendation */}
              {referral && (
                <div style={{
                  backgroundColor: '#0d1117',
                  border: `1px solid ${getRiskColor(result.risk_level)}55`,
                  borderRadius: '16px',
                  padding: '1.2rem',
                  marginTop: '1.5rem',
                  textAlign: 'left',
                  width: '100%',
                  boxSizing: 'border-box'
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
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box'
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

              {/* SHAP Feature Importance Chart with Tabs */}
              {result.shap_features && result.shap_features.length > 0 && (
                <div style={styles.shapCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
                    <div>
                      <p style={styles.shapTitle}>🔍 What's driving your risk?</p>
                      <p style={styles.shapSub}>Each bar shows how much a factor increased or decreased your risk score.</p>
                    </div>
                    {/* Tab Filters */}
                    <div style={{ display: 'flex', gap: '6px', backgroundColor: '#161b22', padding: '4px', borderRadius: '10px' }}>
                      {[
                        { id: 'all', label: 'All Top Drivers' },
                        { id: 'modifiable', label: 'Modifiable Targets' },
                        { id: 'non_modifiable', label: 'Genetic / Baseline' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setShapFilter(tab.id)}
                          style={{
                            backgroundColor: shapFilter === tab.id ? '#a78bfa25' : 'transparent',
                            color: shapFilter === tab.id ? '#a78bfa' : '#94a3b8',
                            border: shapFilter === tab.id ? '1px solid #a78bfa44' : '1px solid transparent',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.shapList}>
                    {(() => {
                      const displayList = (
                        shapFilter === 'modifiable' && result.modifiable_drivers && result.modifiable_drivers.length > 0
                          ? result.modifiable_drivers
                          : shapFilter === 'non_modifiable' && result.non_modifiable_drivers && result.non_modifiable_drivers.length > 0
                          ? result.non_modifiable_drivers
                          : result.shap_features
                      );

                      const maxVal = Math.max(...displayList.map(x => Math.abs(x.value)), 0.01);

                      return displayList.map((f, i) => {
                        const isRisk = f.value > 0;
                        const color = isRisk ? '#ef4444' : '#00d4aa';
                        const barWidth = Math.round((Math.abs(f.value) / maxVal) * 100);
                        return (
                          <div key={i} style={styles.shapRow}>
                            <div style={styles.shapFeatureName}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={styles.shapFeatureLabel}>{f.feature}</span>
                                {f.category && (
                                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', backgroundColor: '#ffffff0a', padding: '1px 6px', borderRadius: '4px' }}>
                                    {f.category}
                                  </span>
                                )}
                              </div>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ ...styles.shapValue, color }}>
                                {isRisk ? '+' : ''}{f.value.toFixed(3)}
                              </span>
                              {f.relative_importance_pct && (
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                                  ({f.relative_importance_pct}%)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Actionable Recommendations for Elevated Modifiable Drivers */}
                  {result.modifiable_drivers && result.modifiable_drivers.some(d => d.recommendation) && (
                    <div style={{
                      backgroundColor: '#161b22',
                      border: '1px solid #ffffff12',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '1.2rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span>💡</span>
                        <span style={{ color: '#00d4aa', fontSize: '0.85rem', fontWeight: '700' }}>
                          ACTIONABLE EVIDENCE-BASED INTERVENTIONS
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {result.modifiable_drivers.filter(d => d.recommendation).map((d, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem' }}>
                            <span style={{ color: '#f59e0b', fontWeight: '700', minWidth: '130px' }}>• {d.feature}:</span>
                            <span style={{ color: '#cbd5e1', lineHeight: '1.4' }}>{d.recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                🔄 Retake
              </button>
              <button
                style={{
                  flex: 2,
                  backgroundColor: '#00d4aa',
                  color: '#080c14',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0,212,170,0.3)',
                }}
                onClick={() => setShowReferralModal(true)}
              >
                🏥 Export Referral PDF →
              </button>
              <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>
                Dashboard →
              </button>
            </div>

            <ReferralReportModal
              isOpen={showReferralModal}
              onClose={() => setShowReferralModal(false)}
              reportData={{
                cogni_score: form.CognitiveScore,
                risk_level: result?.risk_level,
                is_deviating: result?.risk_level === 'High' || result?.risk_level === 'Moderate',
                narrative: referral?.clinical_rationale || 'Patient shows clinical and biomarker indicators requiring specialist workup.',
                referral: referral,
                shap_features: result?.shap_features
              }}
              patientData={{
                name: localStorage.getItem('userEmail')?.split('@')[0] || 'Patient',
                age: form.Age,
                gender: form.Gender,
                email: localStorage.getItem('userEmail') || ''
              }}
            />
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

const styles = {
  container: { maxWidth: '850px', margin: '0 auto' },
  headerRow: { display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.75rem' },
  levelBadge: {
    backgroundColor: '#4338CA18', border: '1px solid #4338CA33',
    color: '#4338CA', fontSize: '0.72rem', fontWeight: '800',
    padding: '0.3rem 0.8rem', borderRadius: '20px', letterSpacing: '0.08em',
    whiteSpace: 'nowrap', marginTop: '4px',
  },
  pageLabel: { color: '#4338CA', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.25rem' },
  pageTitle: { color: '#1e293b', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' },
  pageSub: { color: '#64748b', fontSize: '0.88rem', lineHeight: '1.4', margin: 0 },
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
  },
  progressLabel: { fontSize: '0.75rem', fontWeight: '600', color: '#64748b' },
  progressLine: {
    position: 'absolute', top: '18px', left: '36px', right: '36px',
    height: '2px', backgroundColor: '#e2e8f0', zIndex: 0,
  },
  formCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  stepTitle: { color: '#1e293b', fontSize: '1.15rem', fontWeight: '800', margin: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#475569', fontSize: '0.82rem', fontWeight: '700' },
  hint: { color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.4 },
  calcBtn: {
    backgroundColor: '#f5f3ff', border: '1px solid #c7d2fe',
    color: '#4338CA', borderRadius: '8px', padding: '0.4rem 0.75rem',
    fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start',
  },
  bmiPopup: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '1rem', marginTop: '0.5rem',
  },
  bmiPopupTitle: { color: '#1e293b', fontSize: '0.88rem', fontWeight: '700', margin: '0 0 0.75rem' },
  bmiResult: { textAlign: 'center', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.75rem' },
  bmiUseBtn: {
    backgroundColor: '#4338CA', color: 'white', border: 'none',
    borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.8rem',
    fontWeight: '700', cursor: 'pointer',
  },
  bmiCloseBtn: {
    backgroundColor: 'transparent', color: '#94a3b8', border: 'none',
    fontSize: '0.78rem', cursor: 'pointer', width: '100%', textAlign: 'center',
  },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' },
  prevBtn: {
    backgroundColor: 'transparent', color: '#64748b',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  nextBtn: {
    backgroundColor: '#4338CA', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: '700',
    cursor: 'pointer', marginLeft: 'auto',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  submitBtn: {
    backgroundColor: '#4338CA', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: '700',
    cursor: 'pointer', marginLeft: 'auto',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  resultContainer: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  resultCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '2.5rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
    textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  cardLabel: { color: '#94a3b8', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em' },
  probMeter: { width: '100%', maxWidth: '400px' },
  probTrack: { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
  probFill: { height: '100%', borderRadius: '4px', transition: 'width 1s ease' },
  probLabels: { display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' },
  probScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  probNum: { fontSize: '4rem', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.03em' },
  probLabel: { color: '#64748b', fontSize: '0.88rem', fontWeight: '600' },
  riskPill: { padding: '0.4rem 1.25rem', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '800' },
  modelInfo: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', maxWidth: '440px' },
  modelInfoText: { color: '#64748b', fontSize: '0.75rem', lineHeight: 1.5, margin: 0 },
  shapCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '1.75rem', width: '100%',
    textAlign: 'left', boxSizing: 'border-box', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  shapTitle: { color: '#1e293b', fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.25rem' },
  shapSub: { color: '#64748b', fontSize: '0.8rem', margin: '0 0 1.25rem' },
  shapList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' },
  shapRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  shapFeatureName: { width: '220px', display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 },
  shapFeatureLabel: { color: '#1e293b', fontSize: '0.84rem', fontWeight: '700' },
  shapFeatureInput: { color: '#94a3b8', fontSize: '0.72rem' },
  shapBarContainer: { flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
  shapBar: { height: '100%', borderRadius: '4px', transition: 'width 0.8s ease' },
  shapValue: { width: '55px', textAlign: 'right', fontSize: '0.82rem', fontWeight: '800', flexShrink: 0 },
  shapLegend: { display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' },
  shapLegendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: '600' },
  shapLegendDot: { width: '8px', height: '8px', borderRadius: '50%' },
  actionRow: { display: 'flex', gap: '1rem' },
  retryBtn: {
    flex: 1, backgroundColor: '#ffffff', color: '#64748b',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  dashBtn: {
    flex: 1, backgroundColor: '#4338CA', color: '#ffffff',
    border: 'none', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
};

export default Level2Assessment;
