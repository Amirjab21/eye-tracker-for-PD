import { useRef, useEffect, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { WASM_PATH, MODEL_PATH } from '../constants/app.js';

/**
 * Custom hook for managing MediaPipe Face Landmarker
 * @returns {Object} - { landmarker, isLoading, error }
 */
export function useFaceLandmarker() {
  const landmarkerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load face landmarker:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  return {
    landmarker: landmarkerRef.current,
    isLoading,
    error,
  };
}