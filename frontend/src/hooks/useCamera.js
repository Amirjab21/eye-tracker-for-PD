import { useRef, useEffect } from 'react';
import { CAMERA_CONFIG } from '../constants/app.js';

/**
 * Custom hook for managing camera access and video stream
 * @returns {Object} - { videoRef, initCamera, stopCamera }
 */
export function useCamera() {
  const videoRef = useRef(null);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONFIG);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return stream;
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      throw error;
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    initCamera();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    initCamera,
    stopCamera,
  };
}