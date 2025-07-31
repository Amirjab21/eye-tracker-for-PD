import { useEffect, useRef } from 'react';

/**
 * Custom hook for running a callback at specified intervals
 * @param {Function} callback - Function to call on each interval
 * @param {number|null} delay - Delay in milliseconds, null to pause
 */
export function useInterval(callback, delay) {
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