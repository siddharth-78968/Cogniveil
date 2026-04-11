import React from 'react';

const CogniScoreCard = ({ score }) => {
  if (!score) return null;

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#00d4aa';
    if (risk === 'Moderate') return '#f39c12';
    return '#e74c3c';
  };

  const getScoreColor = (s) => {
    if (s >= 75) return '#00d4aa';
    if (s >= 50) return '#f39c12';
    return '#e74c3c';
  };

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score.score / 100) * circumference;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Your CogniScore</h2>

      <div style={styles.circleContainer}>
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#2a2a4a" strokeWidth="10"/>
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={getScoreColor(score.score)}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div style={styles.scoreText}>
          <span style={{ ...styles.scoreNumber, color: getScoreColor(score.score) }}>
            {score.score}
          </span>
          <span style={styles.scoreLabel}>/ 100</span>
        </div>
      </div>

      <div style={{
        ...styles.riskBadge,
        backgroundColor: getRiskColor(score.risk_level) + '22',
        border: `1px solid ${getRiskColor(score.risk_level)}`,
        color: getRiskColor(score.risk_level),
      }}>
        {score.risk_level} Risk
      </div>

      <div style={styles.breakdown}>
        <div style={styles.breakdownItem}>
          <span style={styles.breakdownLabel}>Active Tests</span>
          <span style={styles.breakdownValue}>{score.active_score}</span>
        </div>
        <div style={styles.breakdownItem}>
          <span style={styles.breakdownLabel}>Passive Monitor</span>
          <span style={styles.breakdownValue}>{score.passive_score}</span>
        </div>
      </div>

      <p style={styles.date}>
        Last updated: {new Date(score.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#16213e',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center',
    border: '1px solid #0f3460',
    maxWidth: '320px',
    width: '100%',
  },
  title: {
    color: 'white',
    fontSize: '1.2rem',
    marginBottom: '1.5rem',
    fontWeight: '600',
  },
  circleContainer: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  scoreText: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: '0.75rem',
    color: '#8888aa',
  },
  riskBadge: {
    display: 'inline-block',
    padding: '0.4rem 1.2rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
  },
  breakdown: {
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid #0f3460',
    paddingTop: '1rem',
    marginBottom: '1rem',
  },
  breakdownItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  breakdownLabel: {
    fontSize: '0.75rem',
    color: '#8888aa',
  },
  breakdownValue: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'white',
  },
  date: {
    fontSize: '0.75rem',
    color: '#8888aa',
  },
};

export default CogniScoreCard;