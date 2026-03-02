import React from "react";
import "./ResultsSection.css";

function ResultsSection({ result }) {
  return (
    <div className="results-card">
      <div className="success-badge">
        <span className="badge-icon">✓</span>
        Successfully Identified
      </div>

      <div className="result-content">
        <div className="breed-section">
          <span className="result-emoji">{result.emoji}</span>
          <h2 className="breed-name">{result.name}</h2>
          <p className="breed-origin">📍 {result.origin}</p>
        </div>

        <div className="confidence-section">
          <div className="confidence-header">
            <p className="confidence-label">Confidence Score</p>
            <p className="confidence-value">{result.confidence}%</p>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${result.confidence}%` }}
            ></div>
          </div>
          <p className="confidence-desc">
            {result.confidence >= 90
              ? "Excellent match - Very confident identification"
              : result.confidence >= 80
              ? "Good match - Confident identification"
              : "Moderate match - Reasonable identification"}
          </p>
        </div>

        <div className="breed-highlights">
          <h3 className="highlights-title">Quick Info</h3>
          <div className="highlights-grid">
            <div className="highlight-item">
              <span className="highlight-icon">🥛</span>
              <p>{result.milkYield}</p>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">⚖️</span>
              <p>{result.weight}</p>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🎨</span>
              <p>{result.colors}</p>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">😊</span>
              <p>{result.temperament}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsSection;