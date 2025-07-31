// === App Constants ===
export const SAMPLE_RATE = 30; // ~30 Hz
export const CALIBRATION_STEPS = ["left", "center", "right"];

// Path to WASM and model – adjust if your Vite public assets folder differs
export const WASM_PATH = "/wasm";
export const MODEL_PATH = "/models/face_landmarker.task";
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// MediaPipe landmark indices
export const IRIS_LANDMARKS = {
  LEFT: 468,
  RIGHT: 473,
};

// Camera settings
export const CAMERA_CONFIG = {
  video: { 
    facingMode: "user", 
    frameRate: { ideal: 30, min: 30 }
  }
};

// Data management
export const MAX_GAZE_POINTS = 300;
export const SYNC_INTERVAL = 1000; // 1 second
export const FPS_HISTORY_SIZE = 30;