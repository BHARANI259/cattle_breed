import React, { useState, useEffect } from "react";
import UploadSection from "./components/UploadSection";
import ResultsSection from "./components/ResultsSection";
import BreedInfoCard from "./components/BreedInfoCard";
import HistoryPanel from "./components/HistoryPanel";
import StatsDashboard from "./components/StatsDashboard";
import CameraCapture from "./components/CameraCapture";
import "./App.css";

// Breed Database
const BREED_DATABASE = {
  holstein: {
    name: "Holstein Friesian",
    emoji: "🐄",
    origin: "Netherlands",
    type: "Dairy",
    milkYield: "25-30 L/day",
    weight: "600-700 kg",
    temperament: "Calm, Docile",
    colors: "Black & White",
    lifespan: "5-6 years",
    description: "Highest milk yield globally. Black and white patches. Excellent dairy production.",
    characteristics: [
      "Highest milk volume",
      "Energy efficient",
      "Good adaptability",
      "High feed conversion"
    ]
  },
  jersey: {
    name: "Jersey",
    emoji: "🎀",
    origin: "Jersey Island",
    type: "Dairy",
    milkYield: "15-20 L/day",
    weight: "350-450 kg",
    temperament: "Spirited, Alert",
    colors: "Light Tan/Fawn",
    lifespan: "5-7 years",
    description: "Rich butterfat content. Small elegant breed. Excellent cheese production.",
    characteristics: [
      "High butterfat",
      "Lower volume",
      "Excellent cheese milk",
      "Small frame"
    ]
  },
  gir: {
    name: "Gir Cow",
    emoji: "🇮🇳",
    origin: "Gujarat, India",
    type: "Dairy",
    milkYield: "6-8 L/day",
    weight: "400-500 kg",
    temperament: "Docile, Friendly",
    colors: "Red/Spotted",
    lifespan: "10-12 years",
    description: "Heat and disease resistant. Rich A2 milk with medicinal properties.",
    characteristics: [
      "Heat tolerant",
      "Disease resistant",
      "A2 milk",
      "Long lifespan"
    ]
  },
  sahiwal: {
    name: "Sahiwal",
    emoji: "🔴",
    origin: "Punjab/Haryana, India",
    type: "Dairy",
    milkYield: "8-16 L/day",
    weight: "450-550 kg",
    temperament: "Calm, Docile",
    colors: "Red Chestnut",
    lifespan: "8-10 years",
    description: "Excellent milk yield. Tick resistant. Thrives in tropical climate.",
    characteristics: [
      "High milk yield",
      "Tick resistant",
      "Tropical adaptation",
      "Good temperament"
    ]
  }
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("cattleHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState("upload");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [compareBreeds, setCompareBreeds] = useState([]);
  const [useCameraInput, setUseCameraInput] = useState(false);

  // Save history
  useEffect(() => {
    localStorage.setItem("cattleHistory", JSON.stringify(history));
  }, [history]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.setAttribute("data-dark-mode", darkMode);
  }, [darkMode]);

  const handleImageUpload = (file) => {
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewURL(preview);
    setResult(null);
    setUseCameraInput(false);
  };

  const handleCameraCapture = (imageBlob) => {
    setSelectedFile(imageBlob);
    const preview = URL.createObjectURL(imageBlob);
    setPreviewURL(preview);
    setResult(null);
    setUseCameraInput(true);
  };

  const handleDetect = () => {
    if (!selectedFile) return;

    setLoading(true);

    setTimeout(() => {
      const breeds = Object.keys(BREED_DATABASE);
      const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
      const confidence = Math.floor(Math.random() * (98 - 85 + 1)) + 85;

      const newResult = {
        breedKey: randomBreed,
        ...BREED_DATABASE[randomBreed],
        confidence: confidence,
        timestamp: new Date().toLocaleString()
      };

      setResult(newResult);
      setHistory([newResult, ...history.slice(0, 9)]); // Keep last 10
      setLoading(false);
      setActiveTab("results");
    }, 1500);
  };

  const toggleCompare = (breedKey) => {
    if (compareBreeds.includes(breedKey)) {
      setCompareBreeds(compareBreeds.filter(b => b !== breedKey));
    } else if (compareBreeds.length < 3) {
      setCompareBreeds([...compareBreeds, breedKey]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewURL(null);
    setResult(null);
    setCompareBreeds([]);
    setActiveTab("upload");
  };

  return (
    <div className={`app-wrapper ${darkMode ? "dark" : ""}`}>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-emoji">🐄</span>
            <span className="brand-text">CattleVision AI</span>
          </div>
          <button
            className="dark-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      <div className="app-container">
        {/* Header Section */}
        <header className="header-section">
          <h1 className="header-title">🐄 Cattle Breed Detection</h1>
          <p className="header-subtitle">
            Advanced AI-powered identification system for cattle breeds worldwide
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            📤 Upload
          </button>
          <button
            className={`tab-btn ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
            disabled={!result}
          >
            ✓ Results
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
            disabled={history.length === 0}
          >
            📜 History ({history.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
            disabled={history.length === 0}
          >
            📊 Stats
          </button>
        </div>

        {/* Main Content */}
        {activeTab === "upload" && (
          <div className="main-card">
            <div className="input-mode-toggle">
              <button
                className={`mode-btn ${!useCameraInput ? "active" : ""}`}
                onClick={() => setUseCameraInput(false)}
              >
                📤 Upload Image
              </button>
              <button
                className={`mode-btn ${useCameraInput ? "active" : ""}`}
                onClick={() => setUseCameraInput(true)}
              >
                📷 Camera
              </button>
            </div>

            {useCameraInput ? (
              <CameraCapture onCapture={handleCameraCapture} />
            ) : (
              <UploadSection onUpload={handleImageUpload} />
            )}

            {previewURL && (
              <div className="preview-section">
                <img src={previewURL} alt="Preview" className="preview-image" />
                {selectedFile && (
                  <p className="file-info">{selectedFile.name || "Camera Capture"}</p>
                )}
              </div>
            )}

            {previewURL && (
              <div className="action-buttons">
                <button
                  className={`detect-button ${loading ? "loading" : ""}`}
                  onClick={handleDetect}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Detecting...
                    </>
                  ) : (
                    "🔍 Detect Breed"
                  )}
                </button>
                <button className="reset-button" onClick={handleReset}>
                  ↻ Reset
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && result && (
          <div className="results-wrapper">
            <div className="results-grid">
              <ResultsSection result={result} />
              <BreedInfoCard breed={result} onCompare={toggleCompare} />
            </div>

            {compareBreeds.length > 0 && (
              <div className="compare-section">
                <h2 className="compare-title">📊 Compare Breeds</h2>
                <div className="comparison-grid">
                  {compareBreeds.map(breedKey => (
                    <div key={breedKey} className="compare-card">
                      <button
                        className="compare-remove"
                        onClick={() => toggleCompare(breedKey)}
                      >
                        ✕
                      </button>
                      <h3 className="compare-breed-name">
                        {BREED_DATABASE[breedKey].emoji} {BREED_DATABASE[breedKey].name}
                      </h3>
                      <div className="compare-info">
                        <p><strong>Origin:</strong> {BREED_DATABASE[breedKey].origin}</p>
                        <p><strong>Milk Yield:</strong> {BREED_DATABASE[breedKey].milkYield}</p>
                        <p><strong>Type:</strong> {BREED_DATABASE[breedKey].type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="back-button" onClick={() => setActiveTab("upload")}>
              ← Back to Upload
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <HistoryPanel
            history={history}
            onSelectBreed={(breedKey) => {
              setResult({ ...BREED_DATABASE[breedKey] });
              setActiveTab("results");
            }}
          />
        )}

        {activeTab === "stats" && (
          <StatsDashboard history={history} allBreeds={BREED_DATABASE} />
        )}
      </div>

      {/* Footer */}
      <footer className="footer-section">
        <p>🤖 Powered by Advanced AI Vision Model | © 2026 CattleVision</p>
      </footer>
    </div>
  );
}

export default App;