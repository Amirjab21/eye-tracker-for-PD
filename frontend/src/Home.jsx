import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAllMeasurements, deleteMeasurementsInRange, saveMeasurementLocally } from "./components/localdb";
import { useDeviceLabel } from "./hooks/useDeviceLabel";
import D3Chart from "./components/d3chart"

// === Constants ===
const SAMPLE_RATE = 30; // ~30 Hz
const CALIBRATION_STEPS = ["left", "center", "right"];
// Path to WASM and model – adjust if your Vite public assets folder differs
const WASM_PATH = "/wasm";
const MODEL_PATH = "/models/face_landmarker.task";
const BACKEND_URL = "http://localhost:8000";

// Simple interval hook that runs while delay is not null
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export default function Home() {
  // === Refs & State ===
  const videoRef = useRef(null);
  // const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);

  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [calibrationData, setCalibrationData] = useState({
    left: null,
    center: null,
    right: null,
  });
  const [gazeX, setGazeX] = useState(null); // Normalised horizontal gaze 0‑1
  const [recording, setRecording] = useState(false);
  const [sessionId] = useState(uuidv4());
  const recordingRef = useRef([]); // Holds {t, gazeX}
  const currentFpsRef = useRef(SAMPLE_RATE); // Use useRef to store currentFps

  const [gazeData, setGazeData] = useState([]);
  const handleNewGaze = (gaze_x, timestamp_ms) => {
    setGazeData(prev => [
      ...prev.slice(-299), // keep only the last 300 points for performance
      { timestamp: timestamp_ms, value: gaze_x }
    ]);
  };

  const { label: devicePlatform} = useDeviceLabel();
  console.log(devicePlatform, 'devicePlatform')

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncMeasurements();
      }
    }, 1000); // every 10 seconds
  
    return () => clearInterval(interval);
  }, []);

  const syncMeasurements = async () => {
    const measurement_batch = await getAllMeasurements();
    console.log(measurement_batch, 'measurement_batch')
    try {
      if (measurement_batch.length > 0) {
        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ measurement_batch }),
        });
      if (response.ok) {
        await deleteMeasurementsInRange(measurement_batch[0].timestamp_ms, measurement_batch[measurement_batch.length - 1].timestamp_ms);
      }
    }
    } catch (e) {
      console.error('Upload failed', e);
    }
  }

  
  useEffect(() => {
    const loadModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  
      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    };
  
    loadModel();
  }, []);

  // === Initialise user‑facing camera ===

  
  useEffect(() => {
  

    const initCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", 
          frameRate: { ideal: 30, min: 30 },
         },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
  
      // let lastTime = performance.now();
      // let frameCount = 0;
      // const video = videoRef.current;
  
      // function measureFrameRate(now) {
      //   frameCount++;
      //   const elapsed = now - lastTime;

      //   if (elapsed >= 1000) {
      //     const fps = frameCount;
      //     console.log(`Effective camera frame rate: ${fps} fps`);
      //     lastTime = now;
      //     frameCount = 0;

      //     currentFpsRef.current = fps;

      //     // Update graph with current frame rate
      //     const graphCanvas = document.getElementById('frameRateGraph');
      //     const ctx = graphCanvas.getContext('2d');
      //     ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
      //     ctx.fillStyle = 'white';
      //     ctx.fillRect(0, graphCanvas.height - (fps / 2), graphCanvas.width, fps / 2); // Scale the bar height
      //     ctx.fillStyle = 'black';
      //     ctx.fillText(`frame rate:${fps} Hz`, 5, 15);
      //   }

      //   video.requestVideoFrameCallback(measureFrameRate);
      // }
  
      // // Start measuring frame rate only if the video is ready
      // if (video.readyState >= 2) { // readyState 2 means "have enough data to play"
      //   video.requestVideoFrameCallback(measureFrameRate);
      // }
    };
    initCamera();
  }, []);

  const performCalibration = useCallback(async () => {
    const landmarker = landmarkerRef.current;
    const video = videoRef.current;
    if (!landmarker || !video || video.readyState !== 4) return;
  
    const results = await landmarker.detectForVideo(video, performance.now());
  
    if (results.faceLandmarks.length) {
      const lm = results.faceLandmarks[0];
      const leftIris = lm[468];
      const rightIris = lm[473];
      const midX = (leftIris.x + rightIris.x) / 2;
  
      if (calibrationIndex < CALIBRATION_STEPS.length && midX) {

        const step = CALIBRATION_STEPS[calibrationIndex];
        setCalibrationData((prev) => (prev[step] ? prev : { ...prev, [step]: midX }));
        setCalibrationIndex((i) => i + 1);
        
      }
    }
  }, [calibrationIndex, calibrationData]);
  
  const lastFrameTimeRef = useRef(performance.now());
  const frameTimestampsRef = useRef([]); // To keep a short history
  // === Frame loop ===
  const processFrame = useCallback(async () => {
    if (!recording) {
      return
    }
    const landmarker = landmarkerRef.current;
    const video = videoRef.current;
    if (!landmarker || !video || video.readyState !== 4) return;

    const results = await landmarker.detectForVideo(video, performance.now());

    const now = performance.now();
    const elapsed = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    frameTimestampsRef.current.push(elapsed);
    if (frameTimestampsRef.current.length > 30) {
      frameTimestampsRef.current.shift(); // Keep the last 30 frames
    }

    // Average FPS over last N frames
    const avgFrameTime = frameTimestampsRef.current.reduce((a, b) => a + b, 0) / frameTimestampsRef.current.length;
    const currentFps = 1000 / avgFrameTime;

    if (results.faceLandmarks.length) {
      // Iris landmark indices (468–473). We'll take 468 (left) & 473 (right)
      const lm = results.faceLandmarks[0];
      const leftIris = lm[468];
      const rightIris = lm[473];
      const midX = (leftIris.x + rightIris.x) / 2; // normalised 0‑1
     
      // === Calculate calibrated horizontal gaze ===
      const { left, center, right } = calibrationData;
      // console.log(left, center, right, 'leftrightcenter')
      let calibratedX = null;
      if (left !== null && center !== null && right !== null) {
        if (midX <= center) {
          calibratedX = (midX - center) / (center - left);
        } else {
          calibratedX = (midX - center) / (right - center);
        }
        // Clip to [-1,1]
        calibratedX = Math.max(-1, Math.min(1, calibratedX));
        // console.log(calibratedX)
        setGazeX(calibratedX);
        currentFpsRef.current = parseFloat(currentFps.toFixed(2));
        const timestamp = Date.now()
        handleNewGaze(calibratedX, timestamp)
        saveMeasurementLocally({
          user_id: sessionId,
          session_id: sessionId,
          timestamp_ms: timestamp,
          gaze_x: calibratedX,
          sampling_rate: parseFloat(currentFps.toFixed(2)),  // Save FPS here
          device: devicePlatform,
          calibration_params: [left, center, right],
          device_label: devicePlatform,
        })
      }

      // === Overlay ===
      // const canvas = canvasRef.current;
      // const ctx = canvas.getContext("2d");
      // canvas.width = video.videoWidth;
      // canvas.height = video.videoHeight;
      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      // const xPx = midX * canvas.width;
      // ctx.beginPath();
      // ctx.arc(xPx, canvas.height / 2, 12, 0, 2 * Math.PI);
      // ctx.fillStyle = "#14b8a6"; // teal‑500
      // ctx.fill();
    }

    // === Recording ===
    if (recording) {
      recordingRef.current.push({ t: Date.now(), gazeX: gazeX ?? null });
    }
  }, [calibrationIndex, calibrationData, recording, gazeX]);

  const isCalibrationComplete = () => {
    const { left, center, right } = calibrationData;
    if (left === null || center === null || right === null) {
      return false
    }
    return true
  };

  // Run at ~30 Hz once model is ready
  useInterval(processFrame, landmarkerRef.current && isCalibrationComplete() ? SAMPLE_RATE : null);

  const startRecording = async () => {
    const { left, center, right } = calibrationData;
    if (left === null || center === null || right === null) {
      toast.info('Please calibrate left, right, and center first.');
      return false;
    }
    const video = videoRef.current;
    if (video && !video.srcObject) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", frameRate: { ideal: 30, min: 30 } },
      });
      video.srcObject = stream;
      await video.play();
    }
    recordingRef.current = [];
    setRecording(true);
  };
  const pauseRecording = () => setRecording(false);
  const stopRecording = () => {
    setRecording(false);
    const video = videoRef.current;
    if (video) {
      const stream = video.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      video.srcObject = null; // Clear the stream, but keep the ref!
    }
    // TODO: persist to IndexedDB or offer JSON download
    console.table(recordingRef.current);
  };

  // === Render ===
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-white text-black px-6 py-4 overflow-y-auto">
      <ToastContainer />
      {/* <h2>Record eye</h2> */}
      <p>FPS: {currentFpsRef.current.toFixed(2)}</p>
      <div className="relative w-full sm:w-[640px] h-[480px] rounded-xl">
        <canvas id="frameRateGraph" width="90" height="20" style={{ position: 'absolute', top: 0, right: 0, zIndex: 100 }}></canvas>
        <div style={{ position: 'absolute', top: 0, left: 0, color: 'white', padding: '5px', zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          Left
        </div>
        <video ref={videoRef} className="w-full h-full object-cover relative" />
        {/* <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" /> */}
      </div>
      {/* Recording controls */}
      <div className="mt-6 flex gap-4">
        {calibrationIndex >= CALIBRATION_STEPS.length ? (
          !recording ? (
            <button onClick={startRecording} className="px-4 py-2 bg-teal-600 rounded-lg font-medium">
              Start
            </button>
          ) : (
            <button onClick={pauseRecording} className="px-4 py-2 bg-amber-500 rounded-lg font-medium">
              Pause
            </button>
          )
        ) : (
          <button
            onClick={performCalibration}
            className="px-6 py-3 text-lg font-semibold bg-teal-500 rounded-xl"
          >
            Look {CALIBRATION_STEPS[calibrationIndex].toUpperCase()} & Tap
          </button>
        )}
        {recording && 
            <button onClick={stopRecording} className="px-4 py-2 bg-amber-500 rounded-lg font-medium">
              Stop
            </button>
          }
      </div>
      <div className="w-full max-w-2xl mx-auto mt-4">
        <D3Chart data={gazeData} xIsTime={true} yRange={[-1, 1]} yLabel="X position normalised" />
      </div>
      <p className="mt-4 text-sm text-slate-400">Session ID: {sessionId}</p>
    </div>
  );
}