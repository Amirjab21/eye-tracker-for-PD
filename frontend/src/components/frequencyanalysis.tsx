import React, { useMemo } from "react";
import FFT from "fft.js";
import D3Chart from "./d3chart";

/**
 * FrequencyAnalysis – visualises the dominant movement frequencies in a horizontal eye‑movement time‑series.
 *
 * @param {Array<{ data: number, value: number }>} data  – timestamp (ms) & horizontal‑position pairs
 */
const FrequencyAnalysis = ({ data} ) => {
    const { spectrum, dominantFreq } = useMemo(() => {
  
      if (!data || data.length < 4) {

        return { spectrum: [], dominantFreq: 0 };
      }
  
      // 1️⃣ Ensure power‑of‑two length for radix‑2 FFT
      const N = 1 << Math.floor(Math.log2(data.length));
      const raw = data.slice(0, N).map((p) => p.value);
      // 1️⃣ de-mean
      const mean = raw.reduce((a, b) => a + b, 0) / N;
      let values = raw.map((v) => v - mean);
      // 2️⃣ optional: apply Hann window to reduce spectral leakage
      function hannWindow(arr) {
        const N = arr.length;
        return arr.map((v, n) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (N - 1))));
      }
      values = hannWindow(values);
      // Convert Date to ms number
      const times = data.slice(0, N).map((p) =>
        p.timestamp instanceof Date ? p.timestamp.getTime() : Number(p.timestamp)
      );
  
      // 2️⃣ Estimate sampling rate (assumes quasi‑uniform sampling in ms)
      const avgDt = (times[times.length - 1] - times[0]) / (times.length - 1);
      const sampleRate = 1000 / avgDt; // Hz
  
      // 3️⃣ Run FFT
      const fft = new FFT(N);
      // --- FFT.js correct usage for real input ---
      const input = values; // real input, length N
      const output = fft.createComplexArray(); // length 2*N
      fft.realTransform(output, input);
      fft.completeSpectrum(output);

      // Magnitude spectrum
      const mags = [];
      for (let i = 0; i < N / 2; i++) {
        const re = output[2 * i];
        const im = output[2 * i + 1];
        mags.push(Math.hypot(re, im));
      }
      const spectrum = mags.map((mag, i) => ({
        freq: (i * sampleRate) / N,
        amp: mag,
      }));
  
      // 5️⃣ Dominant frequency
      const dominant = spectrum.reduce(
        (a, b) => (b.amp > a.amp ? b : a),
        spectrum[0] || { freq: 0, amp: 0 }
      );
  
      return {
        spectrum,
        dominantFreq: dominant ? dominant.freq.toFixed(2) : 0,
      };
    }, [data]);

  // Log all amp values before rendering
  // Generate a unique chartId for this chart instance
  const chartId = React.useRef(`freq-chart-${Math.random().toString(36).substr(2, 9)}`);

  const spectrumForD3 = spectrum.map(d => ({
    timestamp: d.freq, // use frequency as the x-axis
    value: d.amp       // use amplitude as the y-axis
  }));

  console.log(spectrum, 'spectrumForD3')

  return (
        <div>
            <h2 className="text-xl font-bold mb-2">Horizontal‑Movement Frequency Spectrum</h2>
            {spectrum.length ? (
            
                <D3Chart xIsTime={false} data={spectrumForD3} xLabel="Frequency (Hz)" yLabel="Amplitude" />
            ) : (
            <p>Provide at least four data to compute a spectrum.</p>
            )}
      </div>
  );
};

export default FrequencyAnalysis;
