import { IRIS_LANDMARKS } from '../constants/app.js';

/**
 * Extract iris midpoint from face landmarks
 * @param {Array} landmarks - Face landmarks array
 * @returns {number|null} - Normalized midpoint X coordinate (0-1)
 */
export function getIrisMidpoint(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  
  const leftIris = landmarks[IRIS_LANDMARKS.LEFT];
  const rightIris = landmarks[IRIS_LANDMARKS.RIGHT];
  
  if (!leftIris || !rightIris) return null;
  
  return (leftIris.x + rightIris.x) / 2;
}

/**
 * Calculate calibrated gaze position
 * @param {number} midX - Current iris midpoint
 * @param {Object} calibrationData - Calibration points {left, center, right}
 * @returns {number|null} - Calibrated gaze X (-1 to 1), null if not calibrated
 */
export function calculateCalibratedGaze(midX, calibrationData) {
  const { left, center, right } = calibrationData;
  
  if (left === null || center === null || right === null || midX === null) {
    return null;
  }
  
  let calibratedX;
  if (midX <= center) {
    calibratedX = (midX - center) / (center - left);
  } else {
    calibratedX = (midX - center) / (right - center);
  }
  
  // Clip to [-1, 1]
  return Math.max(-1, Math.min(1, calibratedX));
}

/**
 * Calculate FPS from frame timestamps
 * @param {Array} frameTimestamps - Array of frame elapsed times
 * @returns {number} - Current FPS
 */
export function calculateFPS(frameTimestamps) {
  if (frameTimestamps.length === 0) return 0;
  
  const avgFrameTime = frameTimestamps.reduce((a, b) => a + b, 0) / frameTimestamps.length;
  return 1000 / avgFrameTime;
}

/**
 * Check if calibration is complete
 * @param {Object} calibrationData - Calibration points {left, center, right}
 * @returns {boolean} - True if all calibration points are set
 */
export function isCalibrationComplete(calibrationData) {
  const { left, center, right } = calibrationData;
  return left !== null && center !== null && right !== null;
}