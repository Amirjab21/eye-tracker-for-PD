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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Initializing Gaze Tracker</h2>
          <p className="text-slate-600">Loading face detection model...</p>
          <div className="mt-4 w-48 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ToastContainer 
        position="top-right"
        className="mt-4"
        toastClassName="backdrop-blur-sm"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Video Feed Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Live Video Feed</h2>
                <p className="text-blue-100 text-sm">Position your face in the center of the frame</p>
              </div>
              
              <div className="p-6">
                <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                  <div className="aspect-video w-full">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    
                    {/* Overlays */}
                    <canvas 
                      id="frameRateGraph" 
                      width="90" 
                      height="20" 
                      className="absolute top-4 right-4 bg-black/50 rounded-lg backdrop-blur-sm"
                    />
                    
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
                      Camera Active
                    </div>
                    
                    {/* Calibration targets */}
                    {!isCalibrationComplete && getCurrentStep() && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Left calibration target */}
                        {getCurrentStep() === 'left' && (
                          <div 
                            className="absolute top-1/2 transform -translate-y-1/2"
                            style={{ left: '10px' }}
                          >
                            <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Center calibration target */}
                        {getCurrentStep() === 'center' && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Right calibration target */}
                        {getCurrentStep() === 'right' && (
                          <div 
                            className="absolute top-1/2 transform -translate-y-1/2"
                            style={{ right: '10px' }}
                          >
                            <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            
            {/* Combined Controls Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
              <div className={`px-6 py-4 ${!isCalibrationComplete ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}>
                <h3 className="text-lg font-semibold text-white">
                  {!isCalibrationComplete ? 'Calibration' : 'Recording'}
                </h3>
                <p className="text-white text-opacity-80 text-sm">
                  {!isCalibrationComplete ? 'Set up gaze tracking' : 'Capture gaze data'}
                </p>
                
                {/* Status Indicators */}
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isCalibrationComplete ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`}></div>
                    <span className="text-sm font-medium text-white text-opacity-90">
                      {isCalibrationComplete ? 'Calibrated' : 'Needs Calibration'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${recording ? 'bg-red-300' : 'bg-slate-300'} ${recording ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm font-medium text-white text-opacity-90">
                      {recording ? 'Recording' : 'Idle'}
                    </span>
                  </div>
                  
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <span className="text-sm font-mono text-black">
                      {currentFps.toFixed(1)} FPS
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {!isCalibrationComplete ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">
                        Look directly at the green circle in the video feed and click the button
                      </p>
                    </div>
                    
                    <button
                      onClick={handleCalibration}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Calibrate ({getCurrentStep()?.toUpperCase()})
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!recording ? (
                      <button 
                        onClick={handleStartRecording} 
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          <span>Start Recording</span>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={pauseRecording} 
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Pause</span>
                          </div>
                        </button>
                        
                        <button 
                          onClick={handleStopRecording} 
                          className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            <span>Stop & Save</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Session Info Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Session Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Session ID</span>
                    <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                      {sessionId?.slice(-8) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Data Points</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {gazeData?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Visualization Section */}
        <div className="mt-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
              <h2 className="text-lg font-semibold text-white">Real-time Gaze Analysis</h2>
              <p className="text-purple-100 text-sm">Live visualization of eye movement data</p>
            </div>
            
            <div className="p-4">
              <div className="h-fit">
                <D3Chart 
                  data={gazeData} 
                  xIsTime={true} 
                  yRange={[-1, 1]} 
                  yLabel="X position normalised" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}