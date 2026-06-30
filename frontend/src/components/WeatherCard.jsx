import React from 'react';
import WeatherIcon, { getWeatherDescription } from './WeatherIcon';

const WeatherCard = ({ currentWeather, dailyWeather, location, isFavorite, onToggleFavorite }) => {
  if (!currentWeather) return null;

  const temp = Math.round(currentWeather.temperature_2m);
  const feelsLike = Math.round(currentWeather.apparent_temperature);
  const humidity = currentWeather.relative_humidity_2m;
  const windSpeed = currentWeather.wind_speed_10m;
  const pressure = Math.round(currentWeather.pressure_msl);
  const uvIndex = currentWeather.uv_index;
  const cloudCover = currentWeather.cloud_cover;
  const isDay = currentWeather.is_day;
  const weatherCode = currentWeather.weather_code;

  // Get high/low from daily forecast for today (first index)
  const todayHigh = dailyWeather && dailyWeather.temperature_2m_max ? Math.round(dailyWeather.temperature_2m_max[0]) : null;
  const todayLow = dailyWeather && dailyWeather.temperature_2m_min ? Math.round(dailyWeather.temperature_2m_min[0]) : null;

  return (
    <div className="weather-card-grid animate-fade-in">
      {/* Main glassmorphism card */}
      <div className="glass-panel weather-main-panel">
        <div className="weather-header">
          <div className="location-info">
            <span className="location-country">
              {location.country} {location.admin1 ? `| ${location.admin1}` : ''}
            </span>
            <h2 className="location-name">
              {location.name}
            </h2>
          </div>
          
          <button 
            className={`favorite-toggle-btn ${isFavorite ? 'is-favorite' : ''}`}
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle Favorite"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={isFavorite ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2" 
              width="20" 
              height="20"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <div className="temp-condition-block">
          <div className="temp-large">
            {temp}
            <span className="temp-degree-symbol">°C</span>
          </div>

          <div className="condition-block">
            <div style={{ width: '80px', height: '80px' }}>
              <WeatherIcon code={weatherCode} isDay={isDay} className="animate-float" />
            </div>
            <div className="condition-desc">{getWeatherDescription(weatherCode)}</div>
            <div className="feels-like">
              Feels like {feelsLike}°C
              {todayHigh !== null && todayLow !== null && (
                <span> • H: {todayHigh}°C L: {todayLow}°C</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of secondary statistics */}
      <div className="glass-panel weather-stats-panel">
        <div className="stat-item">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{humidity}%</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Wind Speed</span>
          <span className="stat-value">{windSpeed} km/h</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">UV Index</span>
          <span className="stat-value">{uvIndex !== undefined ? uvIndex.toFixed(1) : 'N/A'}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Pressure</span>
          <span className="stat-value">{pressure} hPa</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Cloud Cover</span>
          <span className="stat-value">{cloudCover}%</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Precipitation</span>
          <span className="stat-value">{currentWeather.precipitation || 0} mm</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
