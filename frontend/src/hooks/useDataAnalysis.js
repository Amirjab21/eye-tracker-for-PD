import { useMemo } from 'react';
import { 
  calculateVelocity, 
  calculateSummaryStatistics, 
  generateDummyData,
  transformSessionData 
} from '../utils/dataAnalysis.js';

/**
 * Custom hook for data analysis calculations
 * @param {Array} sessionData - Raw session data from backend
 * @param {boolean} useDummyData - Whether to use dummy data when no session data
 * @returns {Object} - Processed data and statistics
 */
export function useDataAnalysis(sessionData, useDummyData = true) {
  // Transform and memoize the chart data
  const chartData = useMemo(() => {
    if (sessionData && sessionData.length > 0) {
      return transformSessionData(sessionData);
    }
    
    // Fallback to dummy data if requested and no real data available
    return useDummyData ? generateDummyData() : [];
  }, [sessionData, useDummyData]);

  // Calculate velocity data
  const velocityData = useMemo(() => {
    return calculateVelocity(chartData);
  }, [chartData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return calculateSummaryStatistics(chartData);
  }, [chartData]);

  // Calculate velocity statistics
  const velocityStats = useMemo(() => {
    return calculateSummaryStatistics(velocityData);
  }, [velocityData]);

  // Additional derived metrics
  const metrics = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        duration: 0,
        samplingRate: 0,
        dataPoints: 0,
      };
    }

    const duration = chartData.length > 1 
      ? (chartData[chartData.length - 1].timestamp - chartData[0].timestamp) / 1000 
      : 0;
    
    const samplingRate = duration > 0 ? chartData.length / duration : 0;

    return {
      duration: duration, // seconds
      samplingRate: samplingRate, // Hz
      dataPoints: chartData.length,
    };
  }, [chartData]);

  return {
    chartData,
    velocityData,
    summaryStats,
    velocityStats,
    metrics,
    hasData: chartData.length > 0,
  };
}