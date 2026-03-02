import React, { useRef, useState } from "react";
import "./CameraCapture.css";

function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const video = videoRef.current;

      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      context.drawImage(video, 0, 0);

      canvasRef.current.toBlob(blob => {
        onCapture(blob);
        stopCamera();
      }, "image/jpeg");
    }
  };

  return (
    <div className="camera-capture">
      {!cameraActive ? (
        <div className="camera-placeholder">
          <div className="camera-icon">📷</div>
          <p className="camera-text">Click to capture an image using your camera</p>
          <button className="camera-start-btn" onClick={startCamera}>
            Start Camera
          </button>
        </div>
      ) : (
        <div className="camera-active">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-video"
          ></video>
          {error && <div className="camera-error">{error}</div>}
          <div className="camera-controls">
            <button className="camera-capture-btn" onClick={capturePhoto}>
              📸 Capture
            </button>
            <button className="camera-stop-btn" onClick={stopCamera}>
              Stop
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
}

export default CameraCapture;
