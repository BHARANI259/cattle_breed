import React from "react";
import "./HistoryPanel.css";

function HistoryPanel({ history, onSelectBreed }) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h2 className="history-title">📜 Detection History</h2>
        <span className="history-count">{history.length} predictions</span>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>No detection history yet. Start by uploading an image!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, idx) => (
            <div key={idx} className="history-item">
              <div className="history-item-content">
                <div className="history-breed">
                  <span className="history-emoji">{item.emoji}</span>
                  <h3 className="history-breed-name">{item.name}</h3>
                </div>
                <div className="history-details">
                  <p className="history-confidence">
                    Confidence: <strong>{item.confidence}%</strong>
                  </p>
                  <p className="history-time">{item.timestamp}</p>
                </div>
              </div>
              <button
                className="history-view-btn"
                onClick={() => onSelectBreed(Object.keys({ [item.name]: item })[0])}
              >
                →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
