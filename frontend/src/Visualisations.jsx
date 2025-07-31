import React from 'react';
import D3Chart from "./components/d3chart";
import FrequencyAnalysis from "./components/frequencyanalysis";
import { useSessionData } from "./hooks/useSessionData";
import { useDataAnalysis } from "./hooks/useDataAnalysis";

/**
 * Statistics display component
 */
function StatisticsDisplay({ title, stats }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Mean: <span className="font-mono">{stats.mean?.toFixed(4) || 'N/A'}</span></div>
        <div>Median: <span className="font-mono">{stats.median?.toFixed(4) || 'N/A'}</span></div>
        <div>Std Dev: <span className="font-mono">{stats.stdDev?.toFixed(4) || 'N/A'}</span></div>
        <div>Range: <span className="font-mono">{stats.range?.toFixed(4) || 'N/A'}</span></div>
        <div>Min: <span className="font-mono">{stats.min?.toFixed(4) || 'N/A'}</span></div>
        <div>Max: <span className="font-mono">{stats.max?.toFixed(4) || 'N/A'}</span></div>
      </div>
    </div>
  );
}

/**
 * Session metrics display component
 */
function SessionMetrics({ metrics }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Session Metrics</h3>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>Duration: <span className="font-mono">{metrics.duration?.toFixed(1)}s</span></div>
        <div>Data Points: <span className="font-mono">{metrics.dataPoints}</span></div>
        <div>Sampling Rate: <span className="font-mono">{metrics.samplingRate?.toFixed(1)} Hz</span></div>
      </div>
    </div>
  );
}

/**
 * Error display component
 */
function ErrorDisplay({ error }) {
  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
      <h3 className="text-red-800 font-semibold mb-2">Error</h3>
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  );
}

/**
 * Main Visualisations component
 */
export default function Visualisations() {
  // Fetch session data
  const {
    sessionIds,
    selectedSessionId,
    sessionData,
    loading,
    error,
    selectSession,
    refreshSessionIds,
  } = useSessionData();

  // Process data for analysis
  const {
    chartData,
    velocityData,
    summaryStats,
    velocityStats,
    metrics,
    hasData,
  } = useDataAnalysis(sessionData);

  return (
    <div className="w-full h-full flex items-center flex-col py-6 px-6">
      <div className="sm:w-[70vw] w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold">Visualisations</h2>
          <button 
            onClick={refreshSessionIds}
            className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {/* Session Selection */}
        <div className="mb-6 flex flex-row justify-end items-center gap-2">
          <label htmlFor="session-select" className="font-medium">Session:</label>
          <select
            id="session-select"
            value={selectedSessionId}
            onChange={e => selectSession(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {sessionIds.length === 0 && (
              <option value="">No sessions available</option>
            )}
            {sessionIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && <ErrorDisplay error={error} />}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-lg">Loading session data...</div>
          </div>
        )}

        {/* Main Content */}
        {!loading && hasData && (
          <div className="space-y-8">
            {/* Session Metrics */}
            <SessionMetrics metrics={metrics} />

            {/* Main Gaze Position Chart */}
            <div className="w-full">
              <h3 className="text-xl font-semibold mb-3">Gaze Position Over Time</h3>
              <D3Chart 
                data={chartData} 
                yRange={[-1, 1]} 
                yLabel="X position normalised" 
              />
            </div>

            {/* Velocity Chart */}
            <div className="w-full">
              <h3 className="text-xl font-semibold mb-3">Gaze Velocity</h3>
              <D3Chart 
                data={velocityData} 
                yLabel="Movement velocity (units/s)" 
              />
            </div>

            {/* Frequency Analysis */}
            <div className="w-full">
              <h3 className="text-xl font-semibold mb-3">Frequency Analysis</h3>
              <FrequencyAnalysis data={chartData} />
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-2 gap-6">
              <StatisticsDisplay 
                title="Gaze Position Statistics" 
                stats={summaryStats} 
              />
              <StatisticsDisplay 
                title="Velocity Statistics" 
                stats={velocityStats} 
              />
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !hasData && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {sessionIds.length === 0 
                ? "No sessions available. Record some data first." 
                : "No data found for the selected session."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}