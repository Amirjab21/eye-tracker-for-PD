import React from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCamera } from "./hooks/useCamera";
import { useFaceLandmarker } from "./hooks/useFaceLandmarker";
import { useCalibration } from "./hooks/useCalibration";
import { useGazeTracking } from "./hooks/useGazeTracking";
import { useDataSync } from "./hooks/useDataSync";
import { useInterval } from "./hooks/useInterval";
import { SAMPLE_RATE } from "./constants/app";
import D3Chart from "./components/d3chart";

export default function Home() {
  // Initialize all the custom hooks
  const { videoRef, initCamera, stopCamera } = useCamera();
  const { landmarker, isLoading } = useFaceLandmarker();
  const { 
    calibrationData, 
    performCalibration, 
    getCurrentStep, 
    isComplete: isCalibrationComplete 
  } = useCalibration();
  const {
    gazeData,
    recording,
    sessionId,
    currentFps,
    processFrame,
    startRecording,
    pauseRecording,
    stopRecording,
  } = useGazeTracking(calibrationData);
  
  // Initialize data sync
  useDataSync();

  // Main processing loop - runs at ~30 Hz once model is ready and calibrated
  useInterval(
    () => processFrame(landmarker, videoRef.current),
    landmarker && isCalibrationComplete ? SAMPLE_RATE : null
  );

  const handleCalibration = async () => {
    await performCalibration(landmarker, videoRef.current);
  };

  const handleStartRecording = async () => {
    if (!isCalibrationComplete) {
      toast.info('Please calibrate left, right, and center first.');
      return;
    }
    
    // Reinitialize camera if needed
    const video = videoRef.current;
    if (video && !video.srcObject) {
      await initCamera();
    }
    
    startRecording();
  };

  const handleStopRecording = () => {
    const recordingData = stopRecording();
    stopCamera();
    // TODO: persist to IndexedDB or offer JSON download
    console.table(recordingData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading face detection model...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-white text-black px-6 py-4 overflow-y-auto">
      <ToastContainer />
      <p>FPS: {currentFps.toFixed(2)}</p>
      
      <div className="relative w-full sm:w-[640px] h-[480px] rounded-xl">
        <canvas 
          id="frameRateGraph" 
          width="90" 
          height="20" 
          style={{ position: 'absolute', top: 0, right: 0, zIndex: 100 }}
        />
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          color: 'white', 
          padding: '5px', 
          zIndex: 100, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)' 
        }}>
          Left
        </div>
        <video ref={videoRef} className="w-full h-full object-cover relative" />
      </div>

      {/* Recording controls */}
      <div className="mt-6 flex gap-4">
        {!isCalibrationComplete ? (
          <button
            onClick={handleCalibration}
            className="px-6 py-3 text-lg font-semibold bg-teal-500 rounded-xl"
          >
            Look {getCurrentStep()?.toUpperCase()} & Tap
          </button>
        ) : !recording ? (
          <button 
            onClick={handleStartRecording} 
            className="px-4 py-2 bg-teal-600 rounded-lg font-medium"
          >
            Start
          </button>
        ) : (
          <button 
            onClick={pauseRecording} 
            className="px-4 py-2 bg-amber-500 rounded-lg font-medium"
          >
            Pause
          </button>
        )}
        
        {recording && (
          <button 
            onClick={handleStopRecording} 
            className="px-4 py-2 bg-amber-500 rounded-lg font-medium"
          >
            Stop
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl mx-auto mt-4">
        <D3Chart 
          data={gazeData} 
          xIsTime={true} 
          yRange={[-1, 1]} 
          yLabel="X position normalised" 
        />
      </div>
      
      <p className="mt-4 text-sm text-slate-400">Session ID: {sessionId}</p>
    </div>
  );
}