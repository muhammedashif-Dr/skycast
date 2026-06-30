import React, { useState, useRef, useEffect } from 'react';

const WeatherChart = ({ hourlyData, currentTime }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [chartWidth, setChartWidth] = useState(500);
  const svgRef = useRef(null);

  if (!hourlyData || !hourlyData.temperature_2m || !hourlyData.time) return null;

  // Find the index corresponding to the current time to start 24h forecast
  let startIndex = 0;
  if (currentTime) {
    // Current time is formatted like "2026-06-30T20:45"
    // Open-Meteo hourly times are "2026-06-30T20:00", etc.
    const currentHourString = currentTime.substring(0, 13) + ':00';
    const index = hourlyData.time.findIndex(t => t.startsWith(currentHourString));
    if (index !== -1) {
      startIndex = index;
    }
  }

  // Slice 24 hours of data
  const times = hourlyData.time.slice(startIndex, startIndex + 24);
  const temps = hourlyData.temperature_2m.slice(startIndex, startIndex + 24);
  const weatherCodes = hourlyData.weather_code ? hourlyData.weather_code.slice(startIndex, startIndex + 24) : [];

  if (temps.length === 0) return null;

  // SVG dimensions
  const height = 140;
  const paddingX = 30;
  const paddingY = 20;

  // Resize listener to make SVG chart responsive
  useEffect(() => {
    if (svgRef.current) {
      setChartWidth(svgRef.current.clientWidth);
    }
    const handleResize = () => {
      if (svgRef.current) {
        setChartWidth(svgRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 1;

  // Scale functions
  const getX = (index) => {
    const usableWidth = chartWidth - paddingX * 2;
    const step = usableWidth / (temps.length - 1);
    return paddingX + index * step;
  };

  const getY = (temp) => {
    const usableHeight = height - paddingY * 2;
    // Invert because SVG y=0 is top
    return height - paddingY - ((temp - minTemp) / tempRange) * usableHeight;
  };

  // Generate points for the path
  const points = temps.map((temp, i) => ({ x: getX(i), y: getY(temp) }));

  // Path data for the line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Path data for the gradient fill (area chart)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z` 
    : '';

  // Handle mouse move to find nearest data point
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Find closest index by mapping mouseX back to indices
    const usableWidth = chartWidth - paddingX * 2;
    const step = usableWidth / (temps.length - 1);
    let index = Math.round((mouseX - paddingX) / step);
    
    // Clamp index
    index = Math.max(0, Math.min(temps.length - 1, index));
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Format labels
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours} ${ampm}`;
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : 0;
  const activeTemp = temps[activeIndex];
  const activeTime = times[activeIndex];

  return (
    <div className="glass-panel chart-panel animate-fade-in">
      <div className="chart-header">
        <h3 className="chart-title">24-Hour Temperature Forecast</h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {hoveredIndex !== null ? (
            <span>
              <strong>{formatTime(activeTime)}:</strong> <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>{Math.round(activeTemp)}°C</span>
            </span>
          ) : (
            <span>Hover chart to inspect hours</span>
          )}
        </div>
      </div>

      <div 
        className="chart-container" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        <svg ref={svgRef} className="chart-svg">
          <defs>
            {/* Gradient fill */}
            <linearGradient id="chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
            </linearGradient>
            {/* Grid Line Gradient */}
            <linearGradient id="grid-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Grid lines (dashed vertical lines at 6h intervals) */}
          {[0, 6, 12, 18, 23].map((idx) => (
            points[idx] && (
              <g key={idx}>
                <line
                  x1={points[idx].x}
                  y1={paddingY}
                  x2={points[idx].x}
                  y2={height - paddingY}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="4,4"
                />
                <text
                  x={points[idx].x}
                  y={height - 2}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {formatTime(times[idx])}
                </text>
              </g>
            )
          ))}

          {/* horizontal min/max guides */}
          <line x1={paddingX} y1={getY(maxTemp)} x2={chartWidth - paddingX} y2={getY(maxTemp)} stroke="rgba(255,255,255,0.04)" />
          <line x1={paddingX} y1={getY(minTemp)} x2={chartWidth - paddingX} y2={getY(minTemp)} stroke="rgba(255,255,255,0.04)" />

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#chart-area-grad)" />}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }}
            />
          )}

          {/* Hover highlight dot */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <g>
              <circle
                cx={points[hoveredIndex].x}
                cy={points[hoveredIndex].y}
                r="7"
                fill="var(--color-accent-hover)"
                stroke="var(--text-primary)"
                strokeWidth="2"
                style={{ filter: '0 0 10px var(--color-accent)' }}
              />
              <line
                x1={points[hoveredIndex].x}
                y1={paddingY}
                x2={points[hoveredIndex].x}
                y2={height - paddingY}
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                opacity="0.3"
              />
            </g>
          )}

          {/* Temperature text tags for min/max */}
          {points.length > 0 && (
            <g>
              {/* Max temp label */}
              {temps.indexOf(maxTemp) !== -1 && (
                <text
                  x={points[temps.indexOf(maxTemp)].x}
                  y={points[temps.indexOf(maxTemp)].y - 8}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="10"
                  fontWeight="700"
                >
                  {Math.round(maxTemp)}°
                </text>
              )}
              {/* Min temp label */}
              {temps.indexOf(minTemp) !== -1 && temps.indexOf(minTemp) !== temps.indexOf(maxTemp) && (
                <text
                  x={points[temps.indexOf(minTemp)].x}
                  y={points[temps.indexOf(minTemp)].y + 13}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {Math.round(minTemp)}°
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default WeatherChart;
