import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from "uuid";
import { getIrisMidpoint, calculateCalibratedGaze, calculateFPS } from '../utils/gazeUtils.js';
import { saveMeasurementLocally } from '../components/localdb.js';
import { MAX_GAZE_POINTS, FPS_HISTORY_SIZE } from '../constants/app.js';
import { useDeviceLabel } from './useDeviceLabel.js';

/**
 * Custom hook for gaze tracking and recording
 * @param {Object} calibrationData - Calibration points
 * @returns {Object} - Gaze tracking state and methods
 */
export function useGazeTracking(calibrationData) {
  const [gazeX, setGazeX] = useState(null);
  const [recording, setRecording] = useState(false);
  const [gazeData, setGazeData] = useState([]);
  const [sessionId] = useState(uuidv4());
  
  const recordingRef = useRef([]);
  const lastFrameTimeRef = useRef(performance.now());
  const frameTimestampsRef = useRef([]);
  const currentFpsRef = useRef(30);
  
  const { label: devicePlatform } = useDeviceLabel();

  const handleNewGaze = useCallback((gaze_x, timestamp_ms) => {
    setGazeData(prev => [
      ...prev.slice(-MAX_GAZE_POINTS + 1), // keep only the last N points for performance
      { timestamp: timestamp_ms, value: gaze_x }
    ]);
  }, []);

  const processFrame = useCallback(async (landmarker, video) => {
    if (!recording || !landmarker || !video || video.readyState !== 4) {
      return null;
    }

    try {
      const results = await landmarker.detectForVideo(video, performance.now());
      
      // Calculate FPS
      const now = performance.now();
      const elapsed = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      
      frameTimestampsRef.current.push(elapsed);
      if (frameTimestampsRef.current.length > FPS_HISTORY_SIZE) {
        frameTimestampsRef.current.shift();
      }
      
      const currentFps = calculateFPS(frameTimestampsRef.current);
      currentFpsRef.current = parseFloat(currentFps.toFixed(2));

      if (results.faceLandmarks.length > 0) {
        const midX = getIrisMidpoint(results.faceLandmarks[0]);
        const calibratedX = calculateCalibratedGaze(midX, calibrationData);
        
        if (calibratedX !== null) {
          setGazeX(calibratedX);
          const timestamp = Date.now();
          
          handleNewGaze(calibratedX, timestamp);
          
          // Save to local storage
          saveMeasurementLocally({
            user_id: sessionId,
            session_id: sessionId,
            timestamp_ms: timestamp,
            gaze_x: calibratedX,
            sampling_rate: currentFpsRef.current,
            device: devicePlatform,
            calibration_params: [calibrationData.left, calibrationData.center, calibrationData.right],
            device_label: devicePlatform,
          });

          // Save to recording buffer
          recordingRef.current.push({ t: timestamp, gazeX: calibratedX });
        }
      }
      
      return currentFpsRef.current;
    } catch (error) {
      console.error('Frame processing failed:', error);
      return null;
    }
  }, [recording, calibrationData, sessionId, devicePlatform, handleNewGaze]);

  const startRecording = useCallback(() => {
    recordingRef.current = [];
    setRecording(true);
  }, []);

  const pauseRecording = useCallback(() => {
    setRecording(false);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    console.table(recordingRef.current);
    return recordingRef.current;
  }, []);

  return {
    gazeX,
    gazeData,
    recording,
    sessionId,
    currentFps: currentFpsRef.current,
    processFrame,
    startRecording,
    pauseRecording,
    stopRecording,
  };
}