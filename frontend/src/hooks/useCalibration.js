import { useState, useCallback } from 'react';
import { CALIBRATION_STEPS } from '../constants/app.js';
import { getIrisMidpoint, isCalibrationComplete } from '../utils/gazeUtils.js';

/**
 * Custom hook for managing gaze calibration
 * @returns {Object} - Calibration state and methods
 */
export function useCalibration() {
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [calibrationData, setCalibrationData] = useState({
    left: null,
    center: null,
    right: null,
  });

  const performCalibration = useCallback(async (landmarker, video) => {
    if (!landmarker || !video || video.readyState !== 4) return false;
    
    try {
      const results = await landmarker.detectForVideo(video, performance.now());
      
      if (results.faceLandmarks.length > 0) {
        const midX = getIrisMidpoint(results.faceLandmarks[0]);
        
        if (calibrationIndex < CALIBRATION_STEPS.length && midX !== null) {
          const step = CALIBRATION_STEPS[calibrationIndex];
          
          // Only update if this step hasn't been calibrated yet
          setCalibrationData((prev) => 
            prev[step] !== null ? prev : { ...prev, [step]: midX }
          );
          setCalibrationIndex((i) => i + 1);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Calibration failed:', error);
      return false;
    }
  }, [calibrationIndex]);

  const resetCalibration = useCallback(() => {
    setCalibrationIndex(0);
    setCalibrationData({
      left: null,
      center: null,
      right: null,
    });
  }, []);

  const getCurrentStep = () => {
    return calibrationIndex < CALIBRATION_STEPS.length 
      ? CALIBRATION_STEPS[calibrationIndex] 
      : null;
  };

  return {
    calibrationIndex,
    calibrationData,
    performCalibration,
    resetCalibration,
    getCurrentStep,
    isComplete: isCalibrationComplete(calibrationData),
  };
}