import { useEffect } from 'react';
import { getAllMeasurements, deleteMeasurementsInRange } from '../components/localdb.js';
import { BACKEND_URL, SYNC_INTERVAL } from '../constants/app.js';

/**
 * Custom hook for syncing local measurements to backend
 */
export function useDataSync() {
  const syncMeasurements = async () => {
    if (!navigator.onLine) return;
    
    try {
      const measurement_batch = await getAllMeasurements();
      console.log(measurement_batch, 'measurement_batch');
      
      if (measurement_batch.length > 0) {
        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ measurement_batch }),
        });
        
        if (response.ok) {
          const firstTimestamp = measurement_batch[0].timestamp_ms;
          const lastTimestamp = measurement_batch[measurement_batch.length - 1].timestamp_ms;
          await deleteMeasurementsInRange(firstTimestamp, lastTimestamp);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(syncMeasurements, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { syncMeasurements };
}