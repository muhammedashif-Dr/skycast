import React from 'react';

// Maps WMO codes to groups: sunny, cloudy, rainy, snowy, stormy, foggy
export const getWeatherGroup = (code) => {
  if (code === 0) return 'sunny';
  if ([1, 2, 3].includes(code)) return 'cloudy';
  if ([45, 48].includes(code)) return 'foggy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'cloudy'; // fallback
};

export const getWeatherDescription = (code) => {
  const mapping = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snowfall',
    73: 'Moderate Snowfall',
    75: 'Heavy Snowfall',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Slight Hail',
    99: 'Thunderstorm with Heavy Hail'
  };
  return mapping[code] || 'Unknown';
};

const WeatherIcon = ({ code, isDay = true, className = '' }) => {
  const group = getWeatherGroup(code);
  const actualIsDay = isDay === true || isDay === 1;

  // Render self-contained animated SVG based on weather category
  switch (group) {
    case 'sunny':
      if (actualIsDay) {
        // Spinning sun
        return (
          <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
            <defs>
              <linearGradient id="sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .sun-element {
                animation: spin 20s linear infinite;
                transform-origin: 32px 32px;
              }
            `}</style>
            <g className="sun-element">
              <circle cx="32" cy="32" r="12" fill="url(#sun-grad)" />
              {/* Sun rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
                <line
                  key={index}
                  x1="32"
                  y1="10"
                  x2="32"
                  y2="16"
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform={`rotate(${angle} 32 32)`}
                />
              ))}
            </g>
          </svg>
        );
      } else {
        // Moon with pulsing glow
        return (
          <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
            <defs>
              <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
            <style>{`
              @keyframes glow {
                0%, 100% { filter: drop-shadow(0 0 2px rgba(226, 232, 240, 0.4)); }
                50% { filter: drop-shadow(0 0 8px rgba(226, 232, 240, 0.7)); }
              }
              .moon-element {
                animation: glow 4s ease-in-out infinite;
              }
            `}</style>
            <path
              className="moon-element"
              d="M36.7,46C26.5,46,18.3,37.8,18.3,27.7c0-6,2.9-11.3,7.4-14.7c-0.8-0.1-1.6-0.2-2.5-0.2c-10.2,0-18.5,8.3-18.5,18.5
              c0,10.2,8.3,18.5,18.5,18.5c7.9,0,14.7-5,17.3-12C39.7,45.4,38.2,46,36.7,46z"
              fill="url(#moon-grad)"
            />
          </svg>
        );
      }

    case 'cloudy':
      // Two clouds drifting slightly
      return (
        <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
          <defs>
            <linearGradient id="cloud-front" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
            <linearGradient id="cloud-back" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>
          <style>{`
            @keyframes drift-front {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(2px, -1px); }
            }
            @keyframes drift-back {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(-3px, 1px); }
            }
            .cloud-f { animation: drift-front 6s ease-in-out infinite; }
            .cloud-b { animation: drift-back 8s ease-in-out infinite; }
          `}</style>
          {/* Back Cloud */}
          <path
            className="cloud-b"
            d="M44.5,23.5C44.5,17.7,39.8,13,34,13c-4.6,0-8.5,3-9.9,7.1C22.8,19.4,21.4,19,20,19c-4.4,0-8,3.6-8,8c0,0.5,0,1,0.1,1.5
            C9.6,29.3,8,31.5,8,34c0,3.3,2.7,6,6,6h29c3.9,0,7-3.1,7-7C50,29.1,47.6,25.2,44.5,23.5z"
            fill="url(#cloud-back)"
          />
          {/* Front Cloud */}
          <path
            className="cloud-f"
            d="M48.5,29.5C48.5,23.7,43.8,19,38,19c-4.6,0-8.5,3-9.9,7.1c-1.3-0.7-2.7-1.1-4.1-1.1c-4.4,0-8,3.6-8,8c0,0.5,0,1,0.1,1.5
            C13.6,35.3,12,37.5,12,40c0,3.3,2.7,6,6,6h29c3.9,0,7-3.1,7-7C54,35.1,51.6,31.2,48.5,29.5z"
            fill="url(#cloud-front)"
          />
        </svg>
      );

    case 'rainy':
      // Cloud with dropping rain streaks
      return (
        <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
          <defs>
            <linearGradient id="rain-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <style>{`
            @keyframes fall {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -12; }
            }
            .rain-drop {
              stroke: #38bdf8;
              stroke-width: 2.5;
              stroke-linecap: round;
              stroke-dasharray: 4, 8;
              animation: fall 1.2s linear infinite;
            }
            .delay-1 { animation-delay: 0.4s; }
            .delay-2 { animation-delay: 0.8s; }
          `}</style>
          <g>
            {/* Rain drops */}
            <line className="rain-drop" x1="22" y1="42" x2="19" y2="54" />
            <line className="rain-drop delay-1" x1="32" y1="42" x2="29" y2="54" />
            <line className="rain-drop delay-2" x1="42" y1="42" x2="39" y2="54" />
            {/* Dark Cloud */}
            <path
              d="M46.5,27.5C46.5,22.3,42.3,18,37,18c-4.1,0-7.6,2.6-8.9,6.2C26.9,23.5,25.6,23,24,23c-3.9,0-7,3.1-7,7c0,0.5,0.1,1,0.2,1.5
              C14.7,32.7,13,34.7,13,37c0,2.8,2.2,5,5,5h27c3.3,0,6-2.7,6-6C51,32.5,49.1,28.9,46.5,27.5z"
              fill="url(#rain-cloud)"
            />
          </g>
        </svg>
      );

    case 'snowy':
      // Cloud with falling/spinning snowflakes
      return (
        <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
          <defs>
            <linearGradient id="snow-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <style>{`
            @keyframes snow-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translateY(12px) rotate(360deg); opacity: 0; }
            }
            .flake {
              fill: #e0f2fe;
              animation: snow-fall 2.5s linear infinite;
              transform-origin: center;
            }
            .flake-1 { animation-delay: 0s; }
            .flake-2 { animation-delay: 0.8s; }
            .flake-3 { animation-delay: 1.6s; }
          `}</style>
          {/* Snowflakes */}
          <circle className="flake flake-1" cx="22" cy="46" r="2" />
          <path className="flake flake-2" d="M31,45 L33,47 M33,45 L31,47 M32,44 L32,48 M30,46 L34,46" stroke="#e0f2fe" strokeWidth="1.2" />
          <circle className="flake flake-3" cx="42" cy="45" r="2.2" />
          {/* Cloud */}
          <path
            d="M46.5,27.5C46.5,22.3,42.3,18,37,18c-4.1,0-7.6,2.6-8.9,6.2C26.9,23.5,25.6,23,24,23c-3.9,0-7,3.1-7,7c0,0.5,0.1,1,0.2,1.5
            C14.7,32.7,13,34.7,13,37c0,2.8,2.2,5,5,5h27c3.3,0,6-2.7,6-6C51,32.5,49.1,28.9,46.5,27.5z"
            fill="url(#snow-cloud)"
          />
        </svg>
      );

    case 'stormy':
      // Rain cloud with lightning bolts
      return (
        <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
          <defs>
            <linearGradient id="storm-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <style>{`
            @keyframes flash {
              0%, 100% { opacity: 0; }
              45%, 55% { opacity: 0; }
              50% { opacity: 1; }
            }
            @keyframes storm-fall {
              0% { transform: translateY(0); opacity: 0; }
              50% { opacity: 0.8; }
              100% { transform: translateY(8px); opacity: 0; }
            }
            .lightning {
              fill: #fbbf24;
              animation: flash 3s steps(1) infinite;
              filter: drop-shadow(0 0 4px #f59e0b);
            }
            .storm-rain {
              stroke: #38bdf8;
              stroke-width: 2;
              stroke-linecap: round;
              animation: storm-fall 1s linear infinite;
            }
            .s-rain-2 { animation-delay: 0.5s; }
          `}</style>
          {/* Storm Rain */}
          <line className="storm-rain" x1="20" y1="42" x2="18" y2="48" />
          <line className="storm-rain s-rain-2" x1="38" y1="42" x2="36" y2="48" />
          {/* Lightning Bolt */}
          <polygon className="lightning" points="30,36 34,36 29,48 35,48 27,56 31,44 26,44" />
          {/* Cloud */}
          <path
            d="M46.5,27.5C46.5,22.3,42.3,18,37,18c-4.1,0-7.6,2.6-8.9,6.2C26.9,23.5,25.6,23,24,23c-3.9,0-7,3.1-7,7c0,0.5,0.1,1,0.2,1.5
            C14.7,32.7,13,34.7,13,37c0,2.8,2.2,5,5,5h27c3.3,0,6-2.7,6-6C51,32.5,49.1,28.9,46.5,27.5z"
            fill="url(#storm-cloud)"
          />
        </svg>
      );

    case 'foggy':
      // Fog icon
      return (
        <svg className={`weather-icon-animated ${className}`} viewBox="0 0 64 64" width="100%" height="100%">
          <style>{`
            @keyframes drift-fog {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(4px); }
            }
            .fog-line {
              stroke: #94a3b8;
              stroke-width: 3.5;
              stroke-linecap: round;
              animation: drift-fog 5s ease-in-out infinite;
            }
            .f-line-2 { animation-delay: 1.5s; }
            .f-line-3 { animation-delay: 3s; }
          `}</style>
          {/* Floating foggy bars */}
          <line className="fog-line" x1="16" y1="20" x2="48" y2="20" />
          <line className="fog-line f-line-2" x1="12" y1="28" x2="52" y2="28" />
          <line className="fog-line f-line-3" x1="18" y1="36" x2="46" y2="36" />
          <line className="fog-line f-line-2" x1="15" y1="44" x2="49" y2="44" />
        </svg>
      );

    default:
      return null;
  }
};

export default WeatherIcon;
