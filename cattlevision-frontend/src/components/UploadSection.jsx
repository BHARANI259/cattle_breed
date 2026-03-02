import React, { useState } from "react";
import "./UploadSection.css";

function UploadSection({ onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onUpload(file);
    } else {
      alert("Please select a valid image file.");
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      onUpload(files[0]);
    } else {
      alert("Please drop a valid image file.");
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-section">
      <div
        className={`upload-box ${dragActive ? "active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon">📤</div>
        <div className="upload-text">
          <p className="main-text">Drag & Drop an image here</p>
          <p className="divider">OR</p>
          <p className="secondary-text">Click to Browse</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="file-input"
        />
      </div>
    </div>
  );
}

export default UploadSection;