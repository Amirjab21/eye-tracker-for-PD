import _ from 'lodash';

/**
 * Calculate velocity between consecutive data points
 * @param {Array} data - Array of {timestamp, value} objects
 * @returns {Array} - Array of velocity data points
 */
export function calculateVelocity(data) {
  if (!data || data.length < 2) return [];
  
  return data.slice(1).map((point, index) => {
    const prevPoint = data[index];
    const timeDiff = (point.timestamp - prevPoint.timestamp) / 1000; // Convert ms to seconds
    const valueDiff = point.value - prevPoint.value;
    return {
      timestamp: point.timestamp,
      value: timeDiff > 0 ? valueDiff / timeDiff : 0, // pixels/second or degrees/second
    };
  });
}

/**
 * Calculate median of an array
 * @param {Array} arr - Array of numbers
 * @returns {number} - Median value
 */
export function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate standard deviation of an array
 * @param {Array} arr - Array of numbers
 * @returns {number} - Standard deviation
 */
export function calculateStandardDeviation(arr) {
  if (!arr || arr.length === 0) return 0;
  
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
}

/**
 * Calculate summary statistics for a dataset
 * @param {Array} data - Array of {timestamp, value} objects
 * @returns {Object} - Summary statistics object
 */
export function calculateSummaryStatistics(data) {
  if (!data || data.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      range: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }
  
  const values = data.map(point => point.value);
  const min = _.min(values);
  const max = _.max(values);
  
  return {
    mean: _.mean(values),
    median: calculateMedian(values),
    stdDev: calculateStandardDeviation(values),
    range: max - min,
    min,
    max,
    count: values.length,
  };
}

/**
 * Generate dummy data for testing/fallback
 * @param {number} length - Number of data points to generate
 * @param {number} interval - Time interval between points in ms
 * @returns {Array} - Array of dummy data points
 */
export function generateDummyData(length = 1000, interval = 1000) {
  const now = Date.now();
  return Array.from({ length }, (_, i) => ({
    timestamp: now + i * interval,
    value: Math.random() * 2 - 1, // Random value between -1 and 1
  }));
}

/**
 * Transform session data to chart format
 * @param {Array} sessionData - Raw session data from backend
 * @returns {Array} - Transformed data for charts
 */
export function transformSessionData(sessionData) {
  if (!sessionData || sessionData.length === 0) return [];
  
  return sessionData.map(d => ({
    timestamp: d.timestamp_ms,
    value: d.gaze_x
  }));
}