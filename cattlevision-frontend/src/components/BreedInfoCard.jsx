import React from "react";
import "./BreedInfoCard.css";

function BreedInfoCard({ breed, onCompare }) {
  return (
    <div className="breed-info-card">
      <div className="breed-header">
        <span className="breed-emoji-large">{breed.emoji}</span>
        <div className="breed-header-text">
          <h2 className="breed-full-name">{breed.name}</h2>
          <p className="breed-origin">📍 {breed.origin}</p>
        </div>
      </div>

      <div className="breed-stats">
        <div className="stat-item">
          <span className="stat-icon">🥛</span>
          <div className="stat-content">
            <p className="stat-label">Milk Yield</p>
            <p className="stat-value">{breed.milkYield}</p>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⚖️</span>
          <div className="stat-content">
            <p className="stat-label">Weight</p>
            <p className="stat-value">{breed.weight}</p>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⏱️</span>
          <div className="stat-content">
            <p className="stat-label">Lifespan</p>
            <p className="stat-value">{breed.lifespan}</p>
          </div>
        </div>
      </div>

      <div className="breed-details">
        <div className="detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{breed.type}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Temperament:</span>
          <span className="detail-value">{breed.temperament}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Colors:</span>
          <span className="detail-value">{breed.colors}</span>
        </div>
      </div>

      <div className="breed-description">
        <p>{breed.description}</p>
      </div>

      <div className="characteristics">
        <h3 className="char-title">Key Characteristics</h3>
        <div className="char-list">
          {breed.characteristics.map((char, idx) => (
            <span key={idx} className="char-badge">
              ✓ {char}
            </span>
          ))}
        </div>
      </div>

      <button
        className="compare-toggle-btn"
        onClick={() => onCompare(breed.name.toLowerCase().replace(" ", "-"))}
      >
        ⚖️ Add to Compare
      </button>
    </div>
  );
}

export default BreedInfoCard;
