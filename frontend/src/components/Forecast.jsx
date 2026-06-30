import React from 'react';
import WeatherIcon from './WeatherIcon';

const Forecast = ({ dailyWeather }) => {
  if (!dailyWeather || !dailyWeather.time) return null;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDay = (dateString, index) => {
    if (index === 0) return 'Today';
    const date = new Date(dateString);
    return daysOfWeek[date.getDay()];
  };

  // Open-Meteo returns 7 days of forecast. Let's map over all of them.
  const forecastData = dailyWeather.time.map((time, idx) => ({
    dayLabel: formatDay(time, idx),
    maxTemp: Math.round(dailyWeather.temperature_2m_max[idx]),
    minTemp: Math.round(dailyWeather.temperature_2m_min[idx]),
    code: dailyWeather.weather_code[idx],
    date: time,
  }));

  return (
    <div className="glass-panel forecast-panel animate-fade-in">
      <h3 className="forecast-title">7-Day Forecast</h3>
      <div className="forecast-list">
        {forecastData.map((item, idx) => (
          <div key={idx} className="forecast-card">
            <span className="forecast-day">{item.dayLabel}</span>
            <div className="forecast-icon">
              <WeatherIcon code={item.code} isDay={true} />
            </div>
            <div className="forecast-temp">
              <span className="forecast-temp-max">{item.maxTemp}°</span>
              <span className="forecast-temp-min">{item.minTemp}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forecast;
