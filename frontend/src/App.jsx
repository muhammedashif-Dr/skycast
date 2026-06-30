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

const API_BASE = import.meta.env.VITE_API_URL || '';

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

  const searchDebounceRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Load favorites & history on mount
  useEffect(() => {
    fetchFavorites();
    fetchHistory();
    fetchWeather(DEFAULT_CITY.lat, DEFAULT_CITY.lon);
  }, []);

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

  // Fetch weather data for coordinates
  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/weather/live?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch live weather details');
      }
      const data = await response.json();
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
      const response = await fetch(`${API_BASE}/api/weather/favorites`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Failed to load favorites list', err);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/weather/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
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
        const response = await fetch(`${API_BASE}/api/weather/search?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
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

    // Save to history in backend
    try {
      await fetch(`${API_BASE}/api/weather/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationObj),
      });
      fetchHistory(); // Refresh history panel
    } catch (err) {
      console.error('Failed to update history', err);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    const isFav = favorites.find(
      (f) => Math.abs(f.lat - selectedLocation.lat) < 0.001 && Math.abs(f.lon - selectedLocation.lon) < 0.001
    );

    try {
      if (isFav) {
        // Remove favorite
        await fetch(`${API_BASE}/api/weather/favorites/${isFav._id}?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`, {
          method: 'DELETE',
        });
      } else {
        // Add favorite
        await fetch(`${API_BASE}/api/weather/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedLocation),
        });
      }
      fetchFavorites(); // Refresh list
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Remove favorite from sidebar button
  const handleRemoveFavorite = async (city) => {
    try {
      await fetch(`${API_BASE}/api/weather/favorites/${city._id}?lat=${city.lat}&lon=${city.lon}`, {
        method: 'DELETE',
      });
      fetchFavorites();
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  // Clear search history
  const handleClearHistory = async () => {
    try {
      await fetch(`${API_BASE}/api/weather/history`, {
        method: 'DELETE',
      });
      fetchHistory();
    } catch (err) {
      console.error('Failed to clear search history', err);
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
