// import WordWallpaper from './components/WordWallPaper';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
// import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
// import { Analytics } from '@vercel/analytics/react';

// import { ViewportBoundary } from "./viewport/viewport-boundary.tsx";
import Home from './Home';
import Visualisations from './Visualisations';
// Register ChartJS components
// ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  return (
    // <ViewportBoundary>
    // <Analytics />
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visualisations" element={<Visualisations />} />
      </Routes>
    </Router>
    // </ViewportBoundary>
  );
}

export default App;
