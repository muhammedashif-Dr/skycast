import React, { useState, useEffect, useRef } from 'react';
import WeatherCard from './components/WeatherCard';
import WeatherChart from './components/WeatherChart';
import Forecast from './components/Forecast';
import SearchHistory from './components/SearchHistory';
import { getWeatherGroup } from './components/WeatherIcon';

const DEFAULT_CITY = {
  name: 'London',
  lat: 51.50853,
  lon: -0.12574,
  country: 'United Kingdom',
  admin1: 'England'
};

const API_BASE = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined' && import.meta.env.VITE_API_URL !== 'null') ? import.meta.env.VITE_API_URL : '';
const useLocalFallback = !API_BASE && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_CITY);
  const [weatherData, setWeatherData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isClientOnly, setIsClientOnly] = useState(useLocalFallback);

  const searchDebounceRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Load favorites & history on mount
  useEffect(() => {
    fetchFavorites();
    fetchHistory();
    fetchWeather(DEFAULT_CITY.lat, DEFAULT_CITY.lon);
  }, [isClientOnly]); // Reload if mode shifts

  // Sync page body background class with current weather condition
  useEffect(() => {
    if (weatherData && weatherData.current) {
      const code = weatherData.current.weather_code;
      const group = getWeatherGroup(code);
      
      // Remove all theme classes
      document.body.className = '';
      
      // Set the appropriate theme class
      document.body.classList.add(`theme-${group}`);
    }
  }, [weatherData]);

  // Click outside listener for search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWeatherDirect = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather from provider');
    return await response.json();
  };

  // Fetch weather data for coordinates
  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (isClientOnly) {
        data = await fetchWeatherDirect(lat, lon);
      } else {
        try {
          const response = await fetch(`${API_BASE}/api/weather/live?lat=${lat}&lon=${lon}`);
          if (!response.ok) throw new Error('Backend returned status ' + response.status);
          
          // Verify response content-type is json
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) {
            throw new Error('Non-JSON response from backend (HTML rewrite caught)');
          }

          data = await response.json();
        } catch (backendErr) {
          console.warn('Backend fetch failed, activating self-healing client fallback:', backendErr.message);
          setIsClientOnly(true);
          data = await fetchWeatherDirect(lat, lon);
        }
      }
      setWeatherData(data);
    } catch (err) {
      setError(err.message || 'Something went wrong fetching weather');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Favorites
  const fetchFavorites = async () => {
    try {
      if (isClientOnly) {
        const localFavs = JSON.parse(localStorage.getItem('aether_favorites') || '[]');
        setFavorites(localFavs);
      } else {
        try {
          const response = await fetch(`${API_BASE}/api/weather/favorites`);
          if (!response.ok) throw new Error();
          
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) throw new Error();

          const data = await response.json();
          setFavorites(data);
        } catch (backendErr) {
          const localFavs = JSON.parse(localStorage.getItem('aether_favorites') || '[]');
          setFavorites(localFavs);
        }
      }
    } catch (err) {
      console.error('Failed to load favorites list', err);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    try {
      if (isClientOnly) {
        const localHistory = JSON.parse(localStorage.getItem('aether_history') || '[]');
        setHistory(localHistory);
      } else {
        try {
          const response = await fetch(`${API_BASE}/api/weather/history`);
          if (!response.ok) throw new Error();

          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) throw new Error();

          const data = await response.json();
          setHistory(data);
        } catch (backendErr) {
          const localHistory = JSON.parse(localStorage.getItem('aether_history') || '[]');
          setHistory(localHistory);
        }
      }
    } catch (err) {
      console.error('Failed to load history list', err);
    }
  };

  // Handle autocomplete search inputs
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        let data;
        if (isClientOnly) {
          const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=5&language=en&format=json`;
          const response = await fetch(url);
          if (response.ok) {
            const resData = await response.json();
            data = resData.results || [];
          } else {
            data = [];
          }
        } else {
          try {
            const response = await fetch(`${API_BASE}/api/weather/search?q=${encodeURIComponent(value)}`);
            if (!response.ok) throw new Error();

            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('application/json')) throw new Error();

            data = await response.json();
          } catch (backendErr) {
            // Self-heal search immediately
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=5&language=en&format=json`;
            const response = await fetch(url);
            if (response.ok) {
              const resData = await response.json();
              data = resData.results || [];
            } else {
              data = [];
            }
          }
        }
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching suggestions', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  // Choose a city from search autocomplete
  const handleSelectCity = async (city) => {
    const locationObj = {
      name: city.name,
      lat: city.latitude || city.lat,
      lon: city.longitude || city.lon,
      country: city.country || '',
      admin1: city.admin1 || city.state || ''
    };
    
    setSelectedLocation(locationObj);
    setSuggestions([]);
    setSearchQuery('');
    
    // Fetch new weather
    await fetchWeather(locationObj.lat, locationObj.lon);

    // Save to history
    if (isClientOnly) {
      const localHistory = JSON.parse(localStorage.getItem('aether_history') || '[]');
      const filtered = localHistory.filter(item => !(Math.abs(item.lat - locationObj.lat) < 0.001 && Math.abs(item.lon - locationObj.lon) < 0.001));
      const updated = [{ ...locationObj, _id: `mem-his-${Date.now()}`, createdAt: new Date() }, ...filtered].slice(0, 10);
      localStorage.setItem('aether_history', JSON.stringify(updated));
      fetchHistory();
    } else {
      try {
        const response = await fetch(`${API_BASE}/api/weather/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationObj),
        });
        
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          fetchHistory();
        } else {
          throw new Error();
        }
      } catch (err) {
        // Local fallback if write fails
        const localHistory = JSON.parse(localStorage.getItem('aether_history') || '[]');
        const filtered = localHistory.filter(item => !(Math.abs(item.lat - locationObj.lat) < 0.001 && Math.abs(item.lon - locationObj.lon) < 0.001));
        const updated = [{ ...locationObj, _id: `mem-his-${Date.now()}`, createdAt: new Date() }, ...filtered].slice(0, 10);
        localStorage.setItem('aether_history', JSON.stringify(updated));
        fetchHistory();
      }
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    const isFav = favorites.find(
      (f) => Math.abs(f.lat - selectedLocation.lat) < 0.001 && Math.abs(f.lon - selectedLocation.lon) < 0.001
    );

    if (isClientOnly) {
      let updated;
      if (isFav) {
        updated = favorites.filter(f => f._id !== isFav._id);
      } else {
        const newFav = { ...selectedLocation, _id: `mem-fav-${Date.now()}`, createdAt: new Date() };
        updated = [newFav, ...favorites];
      }
      localStorage.setItem('aether_favorites', JSON.stringify(updated));
      fetchFavorites();
      return;
    }

    try {
      let response;
      if (isFav) {
        response = await fetch(`${API_BASE}/api/weather/favorites/${isFav._id}?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`${API_BASE}/api/weather/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedLocation),
        });
      }

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        fetchFavorites();
      } else {
        throw new Error();
      }
    } catch (err) {
      // Local fallback on DB fail
      let updated;
      if (isFav) {
        updated = favorites.filter(f => f._id !== isFav._id);
      } else {
        const newFav = { ...selectedLocation, _id: `mem-fav-${Date.now()}`, createdAt: new Date() };
        updated = [newFav, ...favorites];
      }
      localStorage.setItem('aether_favorites', JSON.stringify(updated));
      fetchFavorites();
    }
  };

  // Remove favorite from sidebar button
  const handleRemoveFavorite = async (city) => {
    if (isClientOnly) {
      const updated = favorites.filter(f => f._id !== city._id);
      localStorage.setItem('aether_favorites', JSON.stringify(updated));
      fetchFavorites();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/weather/favorites/${city._id}?lat=${city.lat}&lon=${city.lon}`, {
        method: 'DELETE',
      });
      
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        fetchFavorites();
      } else {
        throw new Error();
      }
    } catch (err) {
      const updated = favorites.filter(f => f._id !== city._id);
      localStorage.setItem('aether_favorites', JSON.stringify(updated));
      fetchFavorites();
    }
  };

  // Clear search history
  const handleClearHistory = async () => {
    if (isClientOnly) {
      localStorage.removeItem('aether_history');
      fetchHistory();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/weather/history`, {
        method: 'DELETE',
      });
      
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        fetchHistory();
      } else {
        throw new Error();
      }
    } catch (err) {
      localStorage.removeItem('aether_history');
      fetchHistory();
    }
  };

  const isCurrentFavorite = favorites.some(
    (f) => Math.abs(f.lat - selectedLocation.lat) < 0.001 && Math.abs(f.lon - selectedLocation.lon) < 0.001
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar Panel */}
      <aside className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
        <div className="header-search">
          <div className="brand">
            <h1>AETHER LIVE</h1>
            <div className="live-dot" />
          </div>

          <div className="search-wrapper" ref={searchContainerRef}>
            <svg 
              className="search-icon-svg" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.636z" />
            </svg>
            <input
              type="text"
              placeholder="Search for a city..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />

            {/* suggestions list */}
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((item) => (
                  <li 
                    key={`${item.id || item.latitude}-${item.longitude}`} 
                    className="suggestion-item"
                    onClick={() => handleSelectCity(item)}
                  >
                    <span className="suggestion-name">
                      {item.name}{item.admin1 ? `, ${item.admin1}` : ''}
                    </span>
                    <span className="suggestion-country">{item.country_code?.toUpperCase() || item.country}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {searchLoading && (
              <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Favorites and History */}
        <SearchHistory
          favorites={favorites}
          history={history}
          onSelectCity={(city) => {
            setSelectedLocation(city);
            fetchWeather(city.lat, city.lon);
          }}
          onRemoveFavorite={handleRemoveFavorite}
          onClearHistory={handleClearHistory}
        />
      </aside>

      {/* Main Panel Content */}
      <main className="main-panel">
        {loading ? (
          <div className="glass-panel loading-wrapper">
            <div className="spinner" />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Fetching live weather metrics...</p>
          </div>
        ) : error ? (
          <div className="glass-panel error-wrapper">
            <span className="error-title">Weather Search Error</span>
            <p className="error-msg">{error}</p>
            <button 
              className="search-input" 
              style={{ width: 'auto', padding: '0.8rem 1.5rem', cursor: 'pointer', borderColor: 'var(--color-accent)' }}
              onClick={() => fetchWeather(selectedLocation.lat, selectedLocation.lon)}
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <WeatherCard
              currentWeather={weatherData.current}
              dailyWeather={weatherData.daily}
              location={selectedLocation}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={handleToggleFavorite}
            />

            <WeatherChart
              hourlyData={weatherData.hourly}
              currentTime={weatherData.current?.time}
            />

            <Forecast
              dailyWeather={weatherData.daily}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
