import React from "react";
import "./StatsDashboard.css";

function StatsDashboard({ history, allBreeds }) {
  // Calculate statistics
  const totalPredictions = history.length;
  const avgConfidence = Math.round(
    history.reduce((sum, h) => sum + h.confidence, 0) / (totalPredictions || 1)
  );

  // Count breed occurrences
  const breedCounts = {};
  history.forEach(h => {
    breedCounts[h.name] = (breedCounts[h.name] || 0) + 1;
  });

  const topBreeds = Object.entries(breedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Find most common type
  const typeCounts = {};
  history.forEach(h => {
    typeCounts[h.type] = (typeCounts[h.type] || 0) + 1;
  });

  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="stats-dashboard">
      <h2 className="stats-title">📊 Detection Statistics</h2>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📸</div>
          <div className="metric-content">
            <p className="metric-label">Total Detections</p>
            <p className="metric-value">{totalPredictions}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <p className="metric-label">Avg. Confidence</p>
            <p className="metric-value">{avgConfidence}%</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🐄</div>
          <div className="metric-content">
            <p className="metric-label">Unique Breeds</p>
            <p className="metric-value">{Object.keys(breedCounts).length}</p>
          </div>
        </div>

        {mostCommonType && (
          <div className="metric-card">
            <div className="metric-icon">🏆</div>
            <div className="metric-content">
              <p className="metric-label">Most Common Type</p>
              <p className="metric-value">{mostCommonType[0]}</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Detected Breeds */}
      {topBreeds.length > 0 && (
        <div className="breed-ranking">
          <h3 className="ranking-title">🥇 Top Detected Breeds</h3>
          <div className="ranking-list">
            {topBreeds.map((entry, idx) => (
              <div key={idx} className="ranking-item">
                <div className="ranking-position">
                  {idx === 0 && "🥇"}
                  {idx === 1 && "🥈"}
                  {idx === 2 && "🥉"}
                  {idx > 2 && `#${idx + 1}`}
                </div>
                <div className="ranking-breed">
                  <h4 className="ranking-name">{entry[0]}</h4>
                  <p className="ranking-count">{entry[1]} detection{entry[1] > 1 ? "s" : ""}</p>
                </div>
                <div className="ranking-bar">
                  <div
                    className="ranking-bar-fill"
                    style={{
                      width: `${(entry[1] / topBreeds[0][1]) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="ranking-percentage">
                  {Math.round((entry[1] / totalPredictions) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breed Type Distribution */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="type-distribution">
          <h3 className="distribution-title">📈 Breed Type Distribution</h3>
          <div className="type-grid">
            {Object.entries(typeCounts).map((entry, idx) => (
              <div key={idx} className="type-card">
                <h4 className="type-name">{entry[0]}</h4>
                <p className="type-count">{entry[1]} breed{entry[1] > 1 ? "s" : ""}</p>
                <div className="type-progress">
                  <div
                    className="type-progress-bar"
                    style={{
                      width: `${(entry[1] / totalPredictions) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Facts */}
      <div className="quick-facts">
        <h3 className="facts-title">💡 Quick Facts</h3>
        <div className="facts-grid">
          {totalPredictions > 0 && (
            <div className="fact-item">
              <span className="fact-icon">✓</span>
              <p>You've detected {Object.keys(breedCounts).length} different cattle breed{Object.keys(breedCounts).length > 1 ? "s" : ""}</p>
            </div>
          )}
          <div className="fact-item">
            <span className="fact-icon">💡</span>
            <p>AI accuracy improves with more diverse images</p>
          </div>
          <div className="fact-item">
            <span className="fact-icon">🌍</span>
            <p>Explore breeds from different regions around the world</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsDashboard;
