import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
// import { Card, CardContent } from '@/components/ui/card';

export default function TimeSeriesZoomPan({ data, yLabel = '', xLabel, yRange = null, xIsTime = true }) {
  const chartRef = useRef(null);
  const clipId = useRef(`clip-${Math.random().toString(36).substr(2, 9)}`);
  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    // Clear any existing content
    d3.select(container).selectAll('*').remove();

    // Get dimensions
    const { width: w, height: h } = container.getBoundingClientRect();
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    // Create SVG group inside margins
    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('class', 'w-full h-full')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Compute x domain
    let minTimestamp = 0;
    let maxX = 0;
    if (xIsTime) {
      minTimestamp = d3.min(data, d => d.timestamp);
      maxX = d3.max(data, d => (d.timestamp - minTimestamp) / 1000);
    } else {
      maxX = d3.max(data, d => d.timestamp);
    }

    // Scales
    const x = d3
      .scaleLinear()
      .domain([0, maxX])
      .range([0, width]);

    const yDomain = yRange ? yRange : d3.extent(data, d => d.value);
    const y = d3
      .scaleLinear()
      .domain(yDomain)
      .range([height, 0])
      .nice();

    // Axes
    const xAxis = svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(
        d3.axisBottom(x).tickFormat(d =>
          xIsTime ? d.toFixed(0) + 's' : d.toFixed(2)
        )
      );

    svg.append('g')
      .call(d3.axisLeft(y));

    // X axis label
    svg.append('text')
      .attr('class', 'x axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .text(xLabel || (xIsTime ? 'seconds since start' : 'x'));

    // Y axis label
    svg.append('text')
      .attr('class', 'y axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90)`)
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .text(yLabel);

    // Clip path
    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId.current)
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const chart = svg.append('g')
      .attr('clip-path', `url(#${clipId.current})`);

    // Add background rect (light gray)
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr("opacity", 0.3)
      .attr('fill', '#f3f4f6'); // Tailwind gray-100

    // Add horizontal line at y = 0
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    // Draw initial line
    chart.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(xIsTime ? (d.timestamp - minTimestamp) / 1000 : d.timestamp))
        .y(d => y(d.value)));

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 32])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', event => {
        const zx = event.transform.rescaleX(x);
        xAxis.call(
          d3.axisBottom(zx).tickFormat(d =>
            xIsTime ? d.toFixed(0) + 's' : d.toFixed(2)
          )
        );
        chart.selectAll('path').attr('d', d3.line()
          .x(d => zx(xIsTime ? (d.timestamp - minTimestamp) / 1000 : d.timestamp))
          .y(d => y(d.value)));
      });
    // Append invisible rect for zoom on top
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('cursor', 'move')
      .call(zoom);

  }, [data, yLabel, xLabel, yRange, xIsTime]);

  return (
    <div ref={chartRef} className="w-full h-96"></div>
  );
}
