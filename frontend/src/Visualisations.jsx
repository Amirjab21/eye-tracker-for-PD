import React, { useEffect, useState } from 'react';
import Chart from "./components/chart";
import Chart2 from "./components/chart2";
// import MuiChart from "./components/muichart";
import D3Chart from "./components/d3chart";
import D3V2 from "./components/d3v2";
import _ from 'lodash';
import FrequencyAnalysis from "./components/frequencyanalysis";

const calculateVelocity = (data) => {
    return data.slice(1).map((point, index) => {
      const prevPoint = data[index];
      const timeDiff = (point.timestamp - prevPoint.timestamp) / 1000; // Convert ms to seconds
      const valueDiff = point.value - prevPoint.value;
      return {
        timestamp: point.timestamp,
        value: valueDiff / timeDiff, // pixels/second or degrees/second
      };
    });
  };

const calculateSummaryStatistics = (data) => {

    const median = arr => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    
    const stdDev = arr => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
    };
  const values = data.map(point => point.value);
  return {
    mean: _.mean(values),
    median: median(values),
    stdDev: stdDev(values),
    range: _.max(values) - _.min(values),
  };
};

const generateData = () => {
    const now = Date.now();
    return Array.from({ length: 1000 }, (_, i) => ({
      timestamp: now + i * 1000, // Increment time by 1 second
      value: Math.random() * 2 - 1, // Random value between -1 and 1
    }));
  };
  

//   const generateSimpleConvexData = (length = 1000) => {
//     const now = Date.now();
//     const data = [];
//     const half = Math.floor(length / 2);
  
//     for (let i = 0; i < length; i++) {
//       let value;
//       if (i < half) {
//         // Linear decrease from 1 to 0
//         value = 1 - (i / (half - 1));
//       } else {
//         // Convex decrease from 0 to -1 (quadratic curve)
//         const t = (i - half) / (length - half - 1); // t in [0,1]
//         value = 0 - t * t; // Quadratic: convex from 0 to -1
//       }
//       data.push({
//         date: new Date(now + i * 1000),
//         value,
//       });
//     }
//     return data;
//   };
  
  // Example usage
//   const dummydata = generateSimpleConvexData(1000);
//   const dummydata = generateData();
// console.log(dummydata, 'dum')

//   const velocityData = calculateVelocity(dummydata);
//   console.log(velocityData, 'veloc')
// //   const frequencyData = performFrequencyAnalysis(dummydata);
//   const summaryStats = calculateSummaryStatistics(dummydata);

export default function Visualisations() {
    const [sessionIds, setSessionIds] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [sessionData, setSessionData] = useState([]);
    const [loading, setLoading] = useState(false);

    console.log(import.meta.env.VITE_BACKEND_URL, 'backend url')
    useEffect(() => {
        // Fetch session IDs on mount
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/get_session_ids`)
            .then(res => res.json())
            .then(data => {
                setSessionIds(data.session_ids || []);
                if (data.session_ids && data.session_ids.length > 0) {
                    setSelectedSessionId(data.session_ids[0]);
                }
            });
    }, []);

    useEffect(() => {
        if (!selectedSessionId) return;
        setLoading(true);
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/download?session_id=${selectedSessionId}&as_json=true`)
            .then(res => res.json())
            .then(data => {
                setSessionData(data.data || []);
                setLoading(false);
            });
    }, [selectedSessionId]);

    // Use sessionData for all calculations
    const dummydata = sessionData.length > 0 ? sessionData.map(d => ({
        timestamp: d.timestamp_ms,
        value: d.gaze_x
    })) : generateData();
    const velocityData = calculateVelocity(dummydata);
    const summaryStats = calculateSummaryStatistics(dummydata);

    return (
        <div className="w-full h-full flex items-center flex-col py-6 px-6">
            <div className="sm:w-[70vw] w-full">
                <h2 className="text-4xl">Visualisations</h2>
                <div className="mb-4">
                    <label htmlFor="session-select" className="mr-2">Session:</label>
                    <select
                        id="session-select"
                        value={selectedSessionId}
                        onChange={e => setSelectedSessionId(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        {sessionIds.map(id => (
                            <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                </div>
                {loading ? <div>Loading session data...</div> : <>
                <div className="w-full flex">
                    <D3Chart data={dummydata} yLabel="X position normalised" /> 
                </div>
                
                {/* Display velocityData using a chart or table */}
                <div className="w-full">
                    <D3Chart data={velocityData} yLabel="movement velocity" />
                </div>
                <h2>Movement Frequency Analysis</h2>
                <div>
                    <FrequencyAnalysis data={dummydata} />
                </div>
                {/* Display frequencyData using a chart */}
                <h2>Session Summary Statistics</h2>
                <ul>
                    <li>Mean: {summaryStats.mean}</li>
                    <li>Median: {summaryStats.median}</li>
                    <li>Standard Deviation: {summaryStats.stdDev}</li>
                    <li>Range: {summaryStats.range}</li>
                </ul>
                </>}
            </div>
        </div>
    );
}