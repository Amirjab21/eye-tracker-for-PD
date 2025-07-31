import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
// import { Card, CardContent } from '@/components/ui/card';

export default function TimeSeriesFocusContext({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    // Dimensions and margins
    const { width: w, height: h } = container.getBoundingClientRect();
    const margin = { top: 20, right: 20, bottom: 20, left: 50 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    // Heights for focus and context
    const focusHeight = height * 0.7;
    const contextHeight = height * 0.2;

    // Create SVG
    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('class', 'w-full h-full')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);

    const x2 = d3.scaleTime()
      .domain(x.domain())
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([-1, 1])
      .range([focusHeight, 0]);

    const y2 = d3.scaleLinear()
      .domain([-1, 1])
      .range([contextHeight, 0]);

    // Axis generators
    const xAxis = g => g
      .attr('transform', `translate(0,${focusHeight})`)
      .call(d3.axisBottom(x));

    const xAxis2 = g => g
      .attr('transform', `translate(0,${contextHeight})`)
      .call(d3.axisBottom(x2));

    const yAxis = g => g.call(d3.axisLeft(y));


    const area = d3
      .line()
      .x(d => x(d.date))
      .y(d => y(d.value));

    const area2 = d3
        .line()
        .x(d => x2(d.date))
        .y(d => y2(d.value));

    // Focus container
    const focus = svg.append('g').attr('class', 'focus');


    focus.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 1)
    .attr('d', area);

    focus.append('g').call(xAxis);
    focus.append('g').call(yAxis);

    // Add horizontal line at y = 0
    focus.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    // Context container
    const context = svg.append('g')
      .attr('class', 'context')
      .attr('transform', `translate(0,${focusHeight + margin.bottom})`);

    context.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('d', area2);

    context.append('g').call(xAxis2);

    // Brush
    const brush = d3.brushX()
      .extent([[0, 0], [width, contextHeight]])
      .on('brush end', brushed);

    context.append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move, x2.range().map(t => [t, t])[1] ? x2.range() : [0, width]);

    function brushed(event) {
      if (!event.selection) return;
      const [s, e] = event.selection;
      x.domain([x2.invert(s), x2.invert(e)]);
      focus.select('path')
        .attr('d', area);
      focus.select('.x-axis').call(d3.axisBottom(x));
    }

    // Add focus x-axis class
    focus.select('g')
      .attr('class', 'x-axis');

  }, [data]);

  return (
        <div ref={chartRef} className="w-full h-96"></div>
  );
}
